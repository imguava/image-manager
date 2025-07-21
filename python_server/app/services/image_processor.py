import io
from PIL import Image, ImageOps
from typing import BinaryIO, Dict, List, Optional, Tuple, Union

from app.services.ai_description import generate_image_description


class ImageProcessor:
    """
    Image processing service for handling image operations
    """
    
    @staticmethod
    async def get_image_info(image_data: BinaryIO) -> Dict[str, Union[int, str]]:
        """
        Get image information (width, height, format)
        """
        try:
            with Image.open(image_data) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format.lower() if img.format else "unknown"
                }
        except Exception as e:
            raise ValueError(f"Failed to get image info: {str(e)}")
    
    @staticmethod
    async def generate_thumbnail(image_data: BinaryIO, max_size: int = 300) -> bytes:
        """
        Generate a thumbnail from an image
        """
        try:
            image_data.seek(0)
            with Image.open(image_data) as img:
                # Convert to RGB if needed
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                
                # Calculate new dimensions
                width, height = img.size
                if width > height:
                    new_width = max_size
                    new_height = int(height * max_size / width)
                else:
                    new_height = max_size
                    new_width = int(width * max_size / height)
                
                # Resize image
                thumbnail = img.resize((new_width, new_height), Image.LANCZOS)
                
                # Save to bytes
                output = io.BytesIO()
                thumbnail.save(output, format='JPEG', quality=85)
                output.seek(0)
                
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to generate thumbnail: {str(e)}")
    
    @staticmethod
    async def flip_horizontal(image_data: BinaryIO) -> bytes:
        """
        Flip an image horizontally
        """
        try:
            image_data.seek(0)
            with Image.open(image_data) as img:
                flipped = ImageOps.mirror(img)
                
                # Save to bytes
                output = io.BytesIO()
                flipped.save(output, format=img.format)
                output.seek(0)
                
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to flip image: {str(e)}")
    
    @staticmethod
    async def resize_image(image_data: BinaryIO, max_size: int) -> bytes:
        """
        Resize an image to a maximum dimension
        """
        try:
            image_data.seek(0)
            with Image.open(image_data) as img:
                # Calculate new dimensions
                width, height = img.size
                if width > height and width > max_size:
                    new_width = max_size
                    new_height = int(height * max_size / width)
                elif height > max_size:
                    new_height = max_size
                    new_width = int(width * max_size / height)
                else:
                    # No need to resize
                    return image_data.read()
                
                # Resize image
                resized = img.resize((new_width, new_height), Image.LANCZOS)
                
                # Save to bytes
                output = io.BytesIO()
                resized.save(output, format=img.format)
                output.seek(0)
                
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to resize image: {str(e)}")
    
    @staticmethod
    async def convert_format(image_data: BinaryIO, format: str, quality: int = 85) -> bytes:
        """
        Convert an image to a different format
        """
        try:
            image_data.seek(0)
            with Image.open(image_data) as img:
                # Convert to RGB if needed
                if format.lower() == 'jpeg' and img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                
                # Save to bytes
                output = io.BytesIO()
                img.save(output, format=format.upper(), quality=quality)
                output.seek(0)
                
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Failed to convert image format: {str(e)}")
    
    @staticmethod
    async def batch_process(
        images: List[BinaryIO], 
        operations: List[Dict[str, Union[str, Dict[str, Union[int, str]]]]]
    ) -> List[bytes]:
        """
        Process multiple images with multiple operations
        """
        results = []
        
        for image_data in images:
            processed_data = image_data
            
            for operation in operations:
                op_type = operation.get("type")
                params = operation.get("params", {})
                
                if op_type == "resize":
                    max_size = params.get("maxSize", 1920)
                    processed_data = await ImageProcessor.resize_image(processed_data, max_size)
                    processed_data = io.BytesIO(processed_data)
                
                elif op_type == "flip":
                    processed_data = await ImageProcessor.flip_horizontal(processed_data)
                    processed_data = io.BytesIO(processed_data)
                
                elif op_type == "convert":
                    format = params.get("format", "jpeg")
                    quality = params.get("quality", 85)
                    processed_data = await ImageProcessor.convert_format(processed_data, format, quality)
                    processed_data = io.BytesIO(processed_data)
            
            # Get the final result
            if isinstance(processed_data, io.BytesIO):
                processed_data.seek(0)
                results.append(processed_data.read())
            else:
                results.append(processed_data)
        
        return results
    
    @staticmethod
    async def generate_ai_description(image_data: BinaryIO) -> Tuple[str, float]:
        """
        Generate an AI description for an image
        """
        try:
            image_data.seek(0)
            description, confidence = await generate_image_description(image_data)
            return description, confidence
        except Exception as e:
            print(f"Failed to generate AI description: {str(e)}")
            return None, 0.0


# Create a singleton instance
image_processor = ImageProcessor()