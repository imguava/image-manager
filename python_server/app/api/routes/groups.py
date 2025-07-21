from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.image import Image
from app.models.image_group import ImageGroup
from app.models.user import User
from app.schemas.group import GroupCreate, GroupResponse

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_groups(
    db: Session = Depends(get_db)
) -> Any:
    """
    Get all image groups in tree structure
    """
    # Get all groups
    groups = db.query(ImageGroup).all()
    
    # Build tree structure
    group_dict = {group.id: {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "parent_id": group.parent_id,
        "created_at": group.created_at,
        "level": 0,
        "path": [group.id],
        "full_path": group.name
    } for group in groups}
    
    # Calculate levels and paths
    for group in groups:
        if group.parent_id is not None:
            parent = group_dict.get(group.parent_id)
            if parent:
                group_dict[group.id]["level"] = parent["level"] + 1
                group_dict[group.id]["path"] = parent["path"] + [group.id]
                group_dict[group.id]["full_path"] = f"{parent['full_path']} / {group.name}"
    
    # Sort by path
    result = sorted(group_dict.values(), key=lambda x: x["path"])
    
    return result


@router.post("/", response_model=dict)
async def create_group(
    group: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new image group
    """
    if not group.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分组名称不能为空"
        )
    
    # Check parent group if provided
    if group.parent_id:
        parent = db.query(ImageGroup).filter(ImageGroup.id == group.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="父分组不存在"
            )
    
    # Create group
    new_group = ImageGroup(
        name=group.name,
        description=group.description,
        parent_id=group.parent_id
    )
    
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    return {
        "id": new_group.id,
        "name": new_group.name,
        "description": new_group.description,
        "parent_id": new_group.parent_id,
        "created_at": new_group.created_at,
        "message": "分组创建成功"
    }


@router.post("/{group_id}/images", response_model=dict)
async def add_images_to_group(
    group_id: int,
    image_ids: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Add multiple images to a group
    """
    if not image_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供图片ID列表"
        )
    
    # Check group exists
    group = db.query(ImageGroup).filter(ImageGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分组不存在"
        )
    
    # Add images to group
    added_count = 0
    for image_id in image_ids:
        try:
            image = db.query(Image).filter(Image.id == image_id).first()
            if image and group not in image.groups:
                image.groups.append(group)
                added_count += 1
        except Exception as e:
            print(f"Error adding image {image_id} to group: {e}")
    
    db.commit()
    
    return {"message": f"成功将 {added_count} 张图片添加到分组"}


@router.delete("/{group_id}", response_model=dict)
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete an image group
    """
    # Check group exists
    group = db.query(ImageGroup).filter(ImageGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分组不存在"
        )
    
    # Delete group
    db.delete(group)
    db.commit()
    
    return {"message": "分组删除成功"}