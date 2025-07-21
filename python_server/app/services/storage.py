import io
import os
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException, status
from typing import BinaryIO, Optional, Tuple

from app.core.config import settings


class MinioStorage:
    """
    MinIO storage service for handling file uploads and downloads
    """
    def __init__(self):
        self.client = Minio(
            f"{settings.MINIO_ENDPOINT}:{settings.MINIO_PORT}",
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """
        Ensure the bucket exists, create it if it doesn't
        """
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Bucket '{self.bucket_name}' created successfully")
            else:
                print(f"Bucket '{self.bucket_name}' already exists")
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Storage initialization error: {str(e)}"
            )
    
    async def upload_file(self, path: str, file_data: BinaryIO, content_type: Optional[str] = None) -> str:
        """
        Upload a file to MinIO
        """
        try:
            # Get file size
            file_data.seek(0, os.SEEK_END)
            file_size = file_data.tell()
            file_data.seek(0)
            
            # Upload file
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=path,
                data=file_data,
                length=file_size,
                content_type=content_type
            )
            
            return path
        except S3Error as e:
            print(f"Error uploading file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload error: {str(e)}"
            )
    
    async def get_file_url(self, path: str, expires: int = 3600) -> str:
        """
        Get a presigned URL for a file
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=path,
                expires=timedelta(seconds=expires)
            )
            return url
        except S3Error as e:
            print(f"Error getting file URL: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating file URL: {str(e)}"
            )
    
    async def delete_file(self, path: str) -> bool:
        """
        Delete a file from MinIO
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=path
            )
            return True
        except S3Error as e:
            print(f"Error deleting file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File deletion error: {str(e)}"
            )
    
    async def get_file(self, path: str) -> Tuple[io.BytesIO, int]:
        """
        Get a file from MinIO
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=path
            )
            
            # Read the data
            data = io.BytesIO(response.read())
            
            # Get the size
            data.seek(0, os.SEEK_END)
            size = data.tell()
            data.seek(0)
            
            # Close the response
            response.close()
            response.release_conn()
            
            return data, size
        except S3Error as e:
            print(f"Error getting file: {e}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {str(e)}"
            )


# Create a singleton instance
storage = MinioStorage()