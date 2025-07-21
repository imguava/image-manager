import os
import re
from typing import List, Optional, Set

from fastapi import HTTPException, UploadFile, status


def validate_image_file(file: UploadFile) -> bool:
    """
    Validate if a file is an image
    """
    # Check file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_ext = os.path.splitext(file.filename.lower())[1]
    
    if file_ext not in allowed_extensions:
        return False
    
    # Check content type
    content_type = file.content_type
    if not content_type or not content_type.startswith('image/'):
        return False
    
    return True


def validate_text_file(file: UploadFile) -> bool:
    """
    Validate if a file is a text file
    """
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1]
    
    if file_ext != '.txt':
        return False
    
    # Check content type (some browsers might not set this correctly for .txt)
    content_type = file.content_type
    if content_type and not (content_type == 'text/plain' or content_type == 'application/octet-stream'):
        return False
    
    return True


def validate_upload_files(files: List[UploadFile]) -> None:
    """
    Validate uploaded files
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有上传文件"
        )
    
    # Check if at least one image file is uploaded
    has_image = False
    for file in files:
        if validate_image_file(file):
            has_image = True
            break
    
    if not has_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请至少上传一个图片文件"
        )


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other security issues
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Replace potentially dangerous characters
    filename = re.sub(r'[^\w\s.-]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename


def get_allowed_image_extensions() -> Set[str]:
    """
    Get allowed image extensions
    """
    return {'.jpg', '.jpeg', '.png', '.gif', '.webp'}