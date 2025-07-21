from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.image import Image
from app.models.image_tag import ImageTag
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter()


@router.get("/", response_model=List[TagResponse])
async def get_tags(
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all image tags
    """
    tags = db.query(ImageTag).order_by(ImageTag.is_system.desc(), ImageTag.name.asc()).all()
    
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
            "is_system": tag.is_system,
            "created_at": tag.created_at
        }
        for tag in tags
    ]


@router.post("/", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new image tag
    """
    if not tag.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签名称不能为空"
        )
    
    # Check if tag already exists
    existing_tag = db.query(ImageTag).filter(ImageTag.name == tag.name).first()
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签已存在"
        )
    
    # Create tag
    new_tag = ImageTag(
        name=tag.name,
        color=tag.color or "#3B82F6",
        is_system=False
    )
    
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    
    return {
        "id": new_tag.id,
        "name": new_tag.name,
        "color": new_tag.color,
        "is_system": new_tag.is_system,
        "created_at": new_tag.created_at
    }


@router.post("/{image_id}/tags", response_model=dict)
async def add_tags_to_image(
    image_id: str,
    tag_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Add multiple tags to an image
    """
    if not tag_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供标签ID列表"
        )
    
    # Check image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # Add tags to image
    added_count = 0
    for tag_id in tag_ids:
        try:
            tag = db.query(ImageTag).filter(ImageTag.id == tag_id).first()
            if tag and tag not in image.tags:
                image.tags.append(tag)
                added_count += 1
        except Exception as e:
            print(f"Error adding tag {tag_id} to image: {e}")
    
    db.commit()
    
    return {"message": f"成功为图片添加 {added_count} 个标签"}


@router.delete("/{image_id}/tags/{tag_id}", response_model=dict)
async def remove_tag_from_image(
    image_id: str,
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Remove a tag from an image
    """
    # Check image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # Check tag exists
    tag = db.query(ImageTag).filter(ImageTag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )
    
    # Remove tag from image
    if tag in image.tags:
        image.tags.remove(tag)
        db.commit()
    
    return {"message": "标签移除成功"}