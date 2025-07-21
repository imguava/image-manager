import io
from typing import BinaryIO, Tuple, Optional
import os
import numpy as np
from PIL import Image
import torch
from transformers import AutoConfig, AutoModelForCausalLM
from app.core.config import settings

# Global variables for model and processor
model = None
processor = None
tokenizer = None
cuda_device = 'cuda' if torch.cuda.is_available() else 'cpu'


async def load_model():
    """
    Load the Janus-Pro-7B model for image description
    """
    global model, processor, tokenizer
    
    if not settings.USE_AI_DESCRIPTION:
        return
    
    try:
        # Use Janus-Pro-7B model from settings
        model_path = settings.AI_MODEL_PATH
        
        print(f"Loading AI model: {model_path}")
        
        # Import here to avoid loading these modules if AI description is disabled
        from janus.models import MultiModalityCausalLM, VLChatProcessor
        
        # Load model configuration
        config = AutoConfig.from_pretrained(model_path)
        language_config = config.language_config
        language_config._attn_implementation = 'eager'
        
        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            language_config=language_config,
            trust_remote_code=True
        )
        
        # Move model to appropriate device and precision
        if torch.cuda.is_available():
            model = model.to(torch.bfloat16).cuda()
        else:
            model = model.to(torch.float16)
        
        # Load processor and tokenizer
        processor = VLChatProcessor.from_pretrained(model_path)
        tokenizer = processor.tokenizer
        
        print("Janus-Pro-7B model loaded successfully")
    except Exception as e:
        print(f"Error loading Janus-Pro-7B model: {e}")
        model = None
        processor = None
        tokenizer = None


@torch.inference_mode()
async def generate_image_description(image_data: BinaryIO) -> Tuple[Optional[str], float]:
    """
    Generate a description for an image using Janus-Pro-7B model
    """
    if not settings.USE_AI_DESCRIPTION or model is None or processor is None:
        return None, 0.0
    
    try:
        # Clean CUDA cache before generation
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Set random seed for reproducibility
        seed = settings.AI_SEED
        torch.manual_seed(seed)
        np.random.seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(seed)
        
        # Load and prepare image
        image_data.seek(0)
        pil_image = Image.open(image_data).convert("RGB")
        image_array = np.array(pil_image)
        
        # Define the prompt from settings
        question = settings.AI_PROMPT
        
        # Prepare conversation format for Janus model
        conversation = [
            {
                "role": "<|User|>",
                "content": f"<image_placeholder>\n{question}",
                "images": [image_array],
            },
            {
                "role": "<|Assistant|>", 
                "content": ""
            },
        ]
        
        # Process inputs
        prepare_inputs = processor(
            conversations=conversation, 
            images=[pil_image], 
            force_batchify=True
        ).to(cuda_device, dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float16)
        
        # Generate embeddings and response
        inputs_embeds = model.prepare_inputs_embeds(**prepare_inputs)
        outputs = model.language_model.generate(
            inputs_embeds=inputs_embeds,
            attention_mask=prepare_inputs.attention_mask,
            pad_token_id=tokenizer.eos_token_id,
            bos_token_id=tokenizer.bos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            max_new_tokens=settings.AI_MAX_TOKENS,
            do_sample=True if settings.AI_TEMPERATURE > 0 else False,
            use_cache=True,
            temperature=settings.AI_TEMPERATURE,
            top_p=settings.AI_TOP_P,
        )
        
        # Decode the generated tokens
        description = tokenizer.decode(outputs[0].cpu().tolist(), skip_special_tokens=True)
        
        # Calculate confidence (placeholder - model doesn't provide confidence)
        confidence = 0.9
        
        return description, confidence
    except Exception as e:
        print(f"Error generating image description with Janus-Pro-7B: {e}")
        return None, 0.0