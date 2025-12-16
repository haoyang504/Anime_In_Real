// IS-Net Model Manager
import { AutoModel, RawImage, Tensor } from '@huggingface/transformers';

class ISNetManager {
    constructor() {
        this.model = null;
        this.isLoading = false;
        this.isLoaded = false;
    }

    async loadModel(onProgress) {
        if (this.isLoaded) return true;
        if (this.isLoading) {
            console.log('Model is already loading...');
            return false;
        }

        this.isLoading = true;

        try {
            if (onProgress) onProgress('正在加載模型...');

            // Load model directly without AutoProcessor
            this.model = await AutoModel.from_pretrained('BritishWerewolf/IS-Net-Anime', {
                dtype: 'fp32',
            });

            this.isLoaded = true;
            this.isLoading = false;
            console.log('IS-Net model loaded successfully');
            return true;
        } catch (error) {
            this.isLoading = false;
            console.error('Failed to load IS-Net model:', error);
            throw error;
        }
    }

    // Manual image preprocessing for U2Net/IS-Net
    async preprocessImage(imageElement) {
        // Convert to RawImage
        const rawImage = await RawImage.fromURL(imageElement.src);

        // Resize to 1024x1024 (IS-Net input size)
        const resized = await rawImage.resize(1024, 1024);

        // Get image data
        const imageData = resized.data;
        const [height, width, channels] = [resized.height, resized.width, resized.channels];

        console.log('Image info:', { height, width, channels, dataLength: imageData.length });

        // Create float32 array for normalized pixel values (only RGB, 3 channels)
        const float32Data = new Float32Array(3 * height * width);

        // Normalize: (pixel / 255.0 - mean) / std
        // IS-Net uses ImageNet normalization
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];

        // Convert from interleaved RGBA to planar RGB
        for (let i = 0; i < height * width; i++) {
            for (let c = 0; c < 3; c++) {
                const pixelValue = imageData[i * channels + c] / 255.0;
                const normalized = (pixelValue - mean[c]) / std[c];
                // Store in CHW format: [C, H, W]
                float32Data[c * height * width + i] = normalized;
            }
        }

        // Create tensor with shape [1, 3, 1024, 1024]
        const tensor = new Tensor('float32', float32Data, [1, 3, height, width]);

        console.log('Created tensor:', { shape: tensor.dims, size: tensor.size });

        return tensor;
    }

    async extractCharacter(imageElement) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded. Please load the model first.');
        }

        try {
            // Manually preprocess image
            const inputTensor = await this.preprocessImage(imageElement);

            // Run inference - U2Net expects input named 'img'
            const output = await this.model({ img: inputTensor });

            // Extract mask from output
            // IS-Net outputs a mask, we need to find the correct output key
            let mask;
            if (output.mask) {
                mask = output.mask;
            } else if (output.output) {
                mask = output.output;
            } else if (output[0]) {
                mask = output[0];
            } else {
                // Try to find the first tensor in output
                const keys = Object.keys(output);
                console.log('Model output keys:', keys);
                mask = output[keys[0]];
            }

            console.log('Mask shape:', mask.dims);

            // Create transparent image using mask
            const transparentImage = await this.createTransparentImage(imageElement, mask);

            return transparentImage;
        } catch (error) {
            console.error('Character extraction failed:', error);
            throw error;
        }
    }

    createTransparentImage(imageElement, maskTensor) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = imageElement.naturalWidth;
            canvas.height = imageElement.naturalHeight;

            // Draw original image
            ctx.drawImage(imageElement, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            // Get mask dimensions
            const maskData = maskTensor.data;
            let maskHeight, maskWidth;

            // Handle different mask tensor shapes
            if (maskTensor.dims.length === 4) {
                // [batch, channels, height, width]
                maskHeight = maskTensor.dims[2];
                maskWidth = maskTensor.dims[3];
            } else if (maskTensor.dims.length === 3) {
                // [batch, height, width] or [channels, height, width]
                maskHeight = maskTensor.dims[1];
                maskWidth = maskTensor.dims[2];
            } else {
                // [height, width]
                maskHeight = maskTensor.dims[0];
                maskWidth = maskTensor.dims[1];
            }

            console.log('Applying mask:', maskWidth, 'x', maskHeight);

            // Apply mask to image
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const maskX = Math.floor(x * maskWidth / canvas.width);
                    const maskY = Math.floor(y * maskHeight / canvas.height);
                    const maskIdx = maskY * maskWidth + maskX;

                    // Get mask value and normalize to 0-255
                    let maskValue = maskData[maskIdx];

                    // If mask is in range [0, 1], scale to [0, 255]
                    if (maskValue <= 1.0) {
                        maskValue = Math.floor(maskValue * 255);
                    }

                    // Apply threshold for binary mask
                    maskValue = maskValue > 127 ? 255 : 0;

                    const pixelIdx = (y * canvas.width + x) * 4;
                    pixels[pixelIdx + 3] = maskValue; // Set alpha channel
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Convert to image
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = canvas.toDataURL('image/png');
        });
    }
}

export default ISNetManager;
