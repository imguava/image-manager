import io
import os
import uuid
import zipfile
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import sqlalchemy as sa

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.image import Image
from app.models.image_tag import ImageTag
from app.models.image_group import ImageGroup
from app.models.user import User
from app.schemas.image import ImageCreate, ImageResponse, ImageUpdate
from app.services.image_processor import image_processor
from app.services.storage import storage

router = APIRouter()


@router.get("/", response_model=dict)
async def get_images(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    group_id: Optional[int] = None,
    tag_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get list of images with pagination and filtering
    """
    # Base query
    query = db.query(Image)
    
    # Apply filters
    if search:
        query = query.filter(
            sa.or_(
                Image.original_name.ilike(f"%{search}%"),
                Image.description.ilike(f"%{search}%")
            )
        )
    
    if group_id:
        query = query.join(Image.groups).filter(ImageGroup.id == group_id)
    
    if tag_ids:
        for tag_id in tag_ids:
            query = query.join(Image.tags).filter(ImageTag.id == tag_id)
    
    # Get total count
    total = query.count()
    total_pages = (total + limit - 1) // limit
    
    # Apply pagination
    query = query.order_by(Image.created_at.desc()).offset((page - 1) * limit).limit(limit)
    
    # Execute query
    images = query.all()
    
    # Generate URLs for images
    result = []
    for image in images:
        thumbnail_url = await storage.get_file_url(f"thumbnails/thumb_{image.filename}")
        original_url = await storage.get_file_url(f"originals/{image.filename}")
        
        # Get tags
        tags = [
            {
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "is_system": tag.is_system
            }
            for tag in image.tags
        ]
        
        # Get groups
        groups = [group.name for group in image.groups]
        
        result.append({
            "id": str(image.id),
            "filename": image.filename,
            "original_name": image.original_name,
            "description": image.description,
            "file_size": image.file_size,
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "thumbnail_url": thumbnail_url,
            "original_url": original_url,
            "created_at": image.created_at,
            "updated_at": image.updated_at,
            "tags": tags,
            "groups": groups,
            "ai_description": image.ai_description,
            "ai_confidence": image.ai_confidence
        })
    
    return {
        "images": result,
        "total": total,
        "page": page,
        "total_pages": total_pages,
        "has_more": page < total_pages
    }


@router.post("/upload", response_model=dict)
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload multiple images with optional description files
    """
    # Separate image files and description files
    image_files = []
    description_files = {}
    
    for file in files:
        file_ext = os.path.splitext(file.filename.lower())[1]
        base_name = os.path.splitext(file.filename)[0]
        
        if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            image_files.append(file)
        elif file_ext == '.txt':
            # Read description content
            content = await file.read()
            description_files[base_name] = content.decode('utf-8').strip()
            # Reset file position for potential reuse
            await file.seek(0)
    
    if not image_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有找到有效的图片文件"
        )
    
    results = []
    
    for file in image_files:
        # Generate UUID for image
        image_id = uuid.uuid4()
        file_ext = os.path.splitext(file.filename.lower())[1]
        base_name = os.path.splitext(file.filename)[0]
        new_filename = f"{image_id}{file_ext}"
        thumbnail_filename = f"thumb_{new_filename}"
        
        # Get description if available
        description = description_files.get(base_name)
        
        # Read file content
        content = await file.read()
        file_data = io.BytesIO(content)
        
        # Get image info
        image_info = await image_processor.get_image_info(file_data)
        
        # Generate thumbnail
        file_data.seek(0)
        thumbnail_data = await image_processor.generate_thumbnail(file_data)
        
        # Upload files to storage
        file_data.seek(0)
        original_path = await storage.upload_file(
            f"originals/{new_filename}", 
            file_data, 
            f"image/{image_info['format']}"
        )
        
        thumbnail_path = await storage.upload_file(
            f"thumbnails/{thumbnail_filename}", 
            io.BytesIO(thumbnail_data), 
            "image/jpeg"
        )
        
        # Generate AI description if enabled
        ai_description = None
        ai_confidence = None
        
        if not description and settings.USE_AI_DESCRIPTION:
            file_data.seek(0)
            ai_description, ai_confidence = await image_processor.generate_ai_description(file_data)
        
        # Create image record
        image = Image(
            id=image_id,
            filename=new_filename,
            original_name=file.filename,
            description=description or ai_description,
            file_size=len(content),
            width=image_info["width"],
            height=image_info["height"],
            format=image_info["format"],
            thumbnail_path=thumbnail_path,
            original_path=original_path,
            ai_description=bool(ai_description),
            ai_confidence=ai_confidence
        )
        
        db.add(image)
        
        # Add resolution tag if applicable
        resolution_tag = get_resolution_tag(image_info["width"], image_info["height"])
        if resolution_tag:
            tag = db.query(ImageTag).filter(ImageTag.name == resolution_tag).first()
            if tag:
                image.tags.append(tag)
        
        # Commit to database
        db.commit()
        db.refresh(image)
        
        # Add to results
        results.append({
            "id": str(image.id),
            "filename": file.filename,
            "size": len(content),
            "dimensions": f"{image_info['width']}x{image_info['height']}",
            "format": image_info["format"],
            "description": description,
            "has_description": bool(description)
        })
    
    # Count images with descriptions
    image_count = len(results)
    description_count = sum(1 for r in results if r.get("has_description"))
    
    return {
        "message": f"成功上传 {image_count} 张图片{f'，其中 {description_count} 张包含描述' if description_count > 0 else ''}",
        "images": results
    }


@router.put("/{image_id}/description", response_model=dict)
async def update_image_description(
    image_id: uuid.UUID,
    description: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update image description
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    image.description = description
    image.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "描述更新成功", "description": description}


@router.put("/{image_id}/name", response_model=dict)
async def update_image_name(
    image_id: uuid.UUID,
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update image name
    """
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="图片名称不能为空"
        )
    
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    image.original_name = name.strip()
    image.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "图片名称更新成功", "name": name.strip()}


@router.post("/{image_id}/flip", response_model=dict)
async def flip_image(
    image_id: uuid.UUID,
    direction: str = "horizontal",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Flip image horizontally
    """
    # Get original image
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # Get image file from storage
    file_data, _ = await storage.get_file(f"originals/{image.filename}")
    
    # Flip image
    flipped_data = await image_processor.flip_horizontal(file_data)
    
    # Generate new filenames
    new_image_id = uuid.uuid4()
    file_ext = os.path.splitext(image.original_name)[1]
    new_filename = f"{new_image_id}{file_ext}"
    new_original_name = f"flip_{image.original_name}"
    new_thumbnail_filename = f"thumb_{new_filename}"
    
    # Generate thumbnail
    flipped_buffer = io.BytesIO(flipped_data)
    thumbnail_data = await image_processor.generate_thumbnail(flipped_buffer)
    
    # Upload files to storage
    original_path = await storage.upload_file(
        f"originals/{new_filename}", 
        io.BytesIO(flipped_data), 
        f"image/{image.format}"
    )
    
    thumbnail_path = await storage.upload_file(
        f"thumbnails/{new_thumbnail_filename}", 
        io.BytesIO(thumbnail_data), 
        "image/jpeg"
    )
    
    # Create new image record
    new_image = Image(
        id=new_image_id,
        filename=new_filename,
        original_name=new_original_name,
        description=image.description,
        file_size=len(flipped_data),
        width=image.width,
        height=image.height,
        format=image.format,
        thumbnail_path=thumbnail_path,
        original_path=original_path
    )
    
    db.add(new_image)
    
    # Copy group relations
    for group in image.groups:
        new_image.groups.append(group)
    
    # Copy tag relations
    for tag in image.tags:
        new_image.tags.append(tag)
    
    # Add "水平翻转" tag
    flip_tag = db.query(ImageTag).filter(ImageTag.name == "水平翻转").first()
    if not flip_tag:
        flip_tag = ImageTag(name="水平翻转", color="#9333EA", is_system=True)
        db.add(flip_tag)
        db.flush()
    
    new_image.tags.append(flip_tag)
    
    # Commit to database
    db.commit()
    
    return {
        "message": "图片翻转成功",
        "new_image_id": str(new_image_id),
        "original_name": new_original_name
    }


@router.post("/batch-download")
async def batch_download_images(
    image_ids: List[uuid.UUID],
    format: Optional[str] = "original",
    quality: Optional[int] = 80,
    size: Optional[int] = 8000,
    include_description: Optional[bool] = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Download multiple images as ZIP
    """
    if not image_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择要下载的图片"
        )
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for image_id in image_ids:
            # Get image from database
            image = db.query(Image).filter(Image.id == image_id).first()
            if not image:
                continue
            
            # Get image file from storage
            file_data, _ = await storage.get_file(f"originals/{image.filename}")
            
            # Process image if needed
            if size:
                file_data = await image_processor.resize_image(file_data, size)
                file_data = io.BytesIO(file_data)
            
            if format != "original" and format != image.format:
                file_data.seek(0)
                file_data = await image_processor.convert_format(file_data, format, quality)
                file_data = io.BytesIO(file_data)
            
            # Determine filename
            file_ext = f".{format}" if format != "original" else os.path.splitext(image.original_name)[1]
            base_name = os.path.splitext(image.original_name)[0]
            image_filename = f"{base_name}{file_ext}"
            
            # Add image to ZIP
            file_data.seek(0)
            zip_file.writestr(image_filename, file_data.read())
            
            # Add description file if requested
            if include_description and image.description:
                txt_filename = f"{base_name}.txt"
                zip_file.writestr(txt_filename, image.description)
    
    # Prepare response
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=images.zip"}
    )


@router.delete("/batch", response_model=dict)
async def batch_delete_images(
    image_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete multiple images
    """
    if not image_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请选择要删除的图片"
        )
    
    results = []
    
    for image_id in image_ids:
        try:
            # Get image from database
            image = db.query(Image).filter(Image.id == image_id).first()
            if not image:
                results.append({"image_id": str(image_id), "error": "图片不存在"})
                continue
            
            # Delete files from storage
            await storage.delete_file(f"originals/{image.filename}")
            await storage.delete_file(f"thumbnails/thumb_{image.filename}")
            
            # Delete from database
            db.delete(image)
            
            results.append({"image_id": str(image_id), "success": True})
        except Exception as e:
            results.append({"image_id": str(image_id), "error": str(e)})
    
    # Commit changes
    db.commit()
    
    return {
        "message": "批量删除完成",
        "results": results
    }


@router.get("/{image_id}/download")
async def download_image(
    image_id: uuid.UUID,
    format: Optional[str] = None,
    quality: Optional[int] = 80,
    db: Session = Depends(get_db)
) -> Any:
    """
    Download a single image
    """
    # Get image from database
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # Get image file from storage
    file_data, _ = await storage.get_file(f"originals/{image.filename}")
    
    # Convert format if requested
    if format and format != image.format:
        file_data = await image_processor.convert_format(file_data, format, quality)
    else:
        file_data = file_data.read()
    
    # Determine filename and content type
    if format:
        filename = f"{os.path.splitext(image.original_name)[0]}.{format}"
        content_type = f"image/{format}"
    else:
        filename = image.original_name
        content_type = f"image/{image.format}"
    
    # URL encode the filename for Content-Disposition header
    encoded_filename = filename.replace(" ", "_")
    
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )


def get_resolution_tag(width: int, height: int) -> Optional[str]:
    """
    Get resolution tag based on image dimensions
    """
    max_dimension = max(width, height)
    
    if max_dimension >= 7680:
        return "8K"
    elif max_dimension >= 6144:
        return "7K"
    elif max_dimension >= 5120:
        return "6K"
    elif max_dimension >= 4096:
        return "5K"
    elif max_dimension >= 3072:
        return "4K"
    elif max_dimension >= 2048:
        return "3K"
    elif max_dimension >= 1536:
        return "2K"
    elif max_dimension >= 1024:
        return "1K"
    
    return None