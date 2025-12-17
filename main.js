import ISNetManager from './isnet-manager.js';
import { geminiClient } from './api-client.js';

// DOM Elements
const $ = document.querySelector.bind(document);
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const outputImageEl = $('.output-image');
const htmlEl = document.documentElement;

// Helper to convert Image object to Base64 (JPEG)
const imageToBase64 = (img) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);
    // Return base64 without prefix for API
    return tempCanvas.toDataURL('image/jpeg', 0.9).split(',')[1];
};

// IS-Net Manager
const isnetManager = new ISNetManager();

// Configuration
const config = {
    captureImage: null,
    cameraImage: null,
    extractedCharacter: null,
    characterBounds: null,
    height: 1080,
    margin: 0,
    background: '#EEEEEE',
    // Character position (CENTER point in camera coordinates)
    characterX: 0,
    characterY: 0,
    characterScale: 1.0,
    characterOpacity: 1.0,
    currentMode: 'local', // 'local' or 'ai'
    aiResult: null // Store AI result image
};

// Loading indicators
const loadingStart = (text = '生成中…') => {
    htmlEl.setAttribute('data-loading', 'true');
    htmlEl.setAttribute('data-loading-text', text);
};

const loadingStop = () => {
    htmlEl.setAttribute('data-loading', 'false');
};

// Image loading utilities
const loadImageByURL = (url, onLoad) => {
    loadingStart('加载中…');
    const img = new Image();
    img.onload = () => onLoad(img);
    img.onerror = () => {
        console.error('Failed to load image:', url);
        loadingStop();
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
};

const loadCaptureImageURL = url => {
    loadImageByURL(url, img => {
        config.captureImage = img;

        if (config.cameraImage) {
            if (config.currentMode === 'local' && config.extractedCharacter) {
                drawOverlayImage();
            } else if (config.currentMode === 'ai' && config.aiResult) {
                drawAiResultImage(config.aiResult);
            } else {
                drawPlaceholderImage();
            }
        } else {
            // Show just the screenshot in top half with hint in bottom half
            const { naturalWidth, naturalHeight } = img;
            const rate = naturalWidth / naturalHeight;
            const imgWidth = config.height * rate;
            const imgHeight = config.height;
            const outputWidth = imgWidth + config.margin * 2;
            const outputHeight = imgHeight * 2 + config.margin * 3;

            canvas.width = outputWidth;
            canvas.height = outputHeight;
            outputImageEl.style.aspectRatio = outputWidth / outputHeight;

            ctx.fillStyle = config.background;
            ctx.fillRect(0, 0, outputWidth, outputHeight);

            // Draw screenshot in top half
            ctx.drawImage(img, config.margin, config.margin, imgWidth, imgHeight);

            // Draw hint text in bottom half
            ctx.font = '48px sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                '点选或拖拽上传照片',
                outputWidth / 2,
                imgHeight + config.margin * 2 + imgHeight / 2
            );

            loadingStop();
            generateImage();
        }
    });
};

const loadCameraImageURL = url => {
    loadImageByURL(url, img => {
        config.cameraImage = img;

        if (config.captureImage) {
            if (config.currentMode === 'local' && config.extractedCharacter) {
                drawOverlayImage();
            } else if (config.currentMode === 'ai' && config.aiResult) {
                drawAiResultImage(config.aiResult);
            } else {
                drawPlaceholderImage();
            }
        } else {
            // Show just the camera image in bottom half with hint in top half
            const defaultRate = 16 / 9;
            const imgWidth = config.height * defaultRate;
            const imgHeight = config.height;
            const outputWidth = imgWidth + config.margin * 2;
            const outputHeight = imgHeight * 2 + config.margin * 3;

            canvas.width = outputWidth;
            canvas.height = outputHeight;
            outputImageEl.style.aspectRatio = outputWidth / outputHeight;

            ctx.fillStyle = config.background;
            ctx.fillRect(0, 0, outputWidth, outputHeight);

            // Draw hint text in top half
            ctx.font = '48px sans-serif';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                '点选或拖拽上传截图',
                outputWidth / 2,
                config.margin + imgHeight / 2
            );

            // Draw camera image in bottom half
            const cameraRate = img.naturalWidth / img.naturalHeight;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (cameraRate > defaultRate) {
                drawWidth = img.naturalHeight * defaultRate;
                drawHeight = img.naturalHeight;
                offsetX = (img.naturalWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = img.naturalWidth;
                drawHeight = img.naturalWidth / defaultRate;
                offsetX = 0;
                offsetY = (img.naturalHeight - drawHeight) / 2;
            }

            ctx.drawImage(
                img,
                offsetX, offsetY, drawWidth, drawHeight,
                config.margin, imgHeight + config.margin * 2, imgWidth, imgHeight
            );

            loadingStop();
            generateImage();
        }
    });
};

// Calculate bounding box of non-transparent pixels in an image
const getBoundingBox = (img) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    tempCtx.drawImage(img, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    let minX = tempCanvas.width;
    let minY = tempCanvas.height;
    let maxX = 0;
    let maxY = 0;

    // Scan all pixels to find non-transparent ones
    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
            if (alpha > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Add small padding
    const padding = 5;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(tempCanvas.width - 1, maxX + padding);
    maxY = Math.min(tempCanvas.height - 1, maxY + padding);

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
};

// Generate output image
const generateImage = () => {
    const url = canvas.toDataURL('image/png', 0.9);
    outputImageEl.src = url;
};

// Placeholder image (before character extraction)
const drawPlaceholderImage = () => {
    if (!config.captureImage || !config.cameraImage) {
        return;
    }

    loadingStart();

    const captureImg = config.captureImage;
    const cameraImg = config.cameraImage;

    const { naturalWidth, naturalHeight } = captureImg;
    const rate = naturalWidth / naturalHeight;

    const imgWidth = config.height * rate;
    const imgHeight = config.height;
    const outputWidth = imgWidth + config.margin * 2;
    const outputHeight = imgHeight * 2 + config.margin * 3;

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    outputImageEl.style.aspectRatio = outputWidth / outputHeight;

    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Draw top half (screenshot)
    ctx.drawImage(captureImg, config.margin, config.margin, imgWidth, imgHeight);

    // Draw bottom half (photo)
    const cameraRate = cameraImg.naturalWidth / cameraImg.naturalHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (cameraRate > rate) {
        drawWidth = cameraImg.naturalHeight * rate;
        drawHeight = cameraImg.naturalHeight;
        offsetX = (cameraImg.naturalWidth - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = cameraImg.naturalWidth;
        drawHeight = cameraImg.naturalWidth / rate;
        offsetX = 0;
        offsetY = (cameraImg.naturalHeight - drawHeight) / 2;
    }

    ctx.drawImage(
        cameraImg,
        offsetX, offsetY, drawWidth, drawHeight,
        config.margin, imgHeight + config.margin * 2, imgWidth, imgHeight
    );

    loadingStop();
    generateImage();
};

// Draw AI Result Image (Top: Screenshot, Bottom: AI Result)
const drawAiResultImage = (aiResultImg) => {
    if (!config.captureImage) return;

    config.aiResult = aiResultImg;
    loadingStart();

    const captureImg = config.captureImage;
    // Use AI result as the bottom image
    const bottomImg = aiResultImg;

    const { naturalWidth, naturalHeight } = captureImg;
    const rate = naturalWidth / naturalHeight;

    const imgWidth = config.height * rate;
    const imgHeight = config.height;
    const outputWidth = imgWidth + config.margin * 2;
    const outputHeight = imgHeight * 2 + config.margin * 3;

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    outputImageEl.style.aspectRatio = outputWidth / outputHeight;

    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Draw top half (screenshot)
    ctx.drawImage(captureImg, config.margin, config.margin, imgWidth, imgHeight);

    // Draw bottom half (AI Result)
    const bottomRate = bottomImg.naturalWidth / bottomImg.naturalHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (bottomRate > rate) {
        drawWidth = bottomImg.naturalHeight * rate;
        drawHeight = bottomImg.naturalHeight;
        offsetX = (bottomImg.naturalWidth - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = bottomImg.naturalWidth;
        drawHeight = bottomImg.naturalWidth / rate;
        offsetX = 0;
        offsetY = (bottomImg.naturalHeight - drawHeight) / 2;
    }

    ctx.drawImage(
        bottomImg,
        offsetX, offsetY, drawWidth, drawHeight,
        config.margin, imgHeight + config.margin * 2, imgWidth, imgHeight
    );

    loadingStop();
    generateImage();
};

// Overlay image with extracted character
const drawOverlayImage = () => {
    if (!config.cameraImage) {
        alert('请先上传实拍照片');
        return;
    }

    if (!config.extractedCharacter) {
        alert('请先提取动漫角色');
        return;
    }

    loadingStart();

    const captureImg = config.captureImage;
    const cameraImg = config.cameraImage;

    const { naturalWidth, naturalHeight } = captureImg;
    const rate = naturalWidth / naturalHeight;

    const imgWidth = config.height * rate;
    const imgHeight = config.height;
    const outputWidth = imgWidth + config.margin * 2;
    const outputHeight = imgHeight * 2 + config.margin * 3;

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    outputImageEl.style.aspectRatio = outputWidth / outputHeight;

    // Fill background
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Draw top half (screenshot)
    ctx.drawImage(captureImg, config.margin, config.margin, imgWidth, imgHeight);

    // Draw bottom half (photo with character overlay)
    const cameraRate = cameraImg.naturalWidth / cameraImg.naturalHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (cameraRate > rate) {
        drawWidth = cameraImg.naturalHeight * rate;
        drawHeight = cameraImg.naturalHeight;
        offsetX = (cameraImg.naturalWidth - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = cameraImg.naturalWidth;
        drawHeight = cameraImg.naturalWidth / rate;
        offsetX = 0;
        offsetY = (cameraImg.naturalHeight - drawHeight) / 2;
    }

    ctx.drawImage(
        cameraImg,
        offsetX, offsetY, drawWidth, drawHeight,
        config.margin, imgHeight + config.margin * 2, imgWidth, imgHeight
    );

    // Draw character on top of photo (with clipping)
    ctx.save();

    // Create clipping region - only draw within photo area
    ctx.beginPath();
    ctx.rect(config.margin, imgHeight + config.margin * 2, imgWidth, imgHeight);
    ctx.clip();

    ctx.globalAlpha = config.characterOpacity;

    // Get character bounds
    const bounds = config.characterBounds || {
        x: 0,
        y: 0,
        width: config.extractedCharacter.naturalWidth,
        height: config.extractedCharacter.naturalHeight
    };

    // Calculate character size (match screenshot scale)
    const screenshotScaleRatio = imgWidth / captureImg.naturalWidth;
    const charWidth = bounds.width * config.characterScale * screenshotScaleRatio;
    const charHeight = bounds.height * config.characterScale * screenshotScaleRatio;

    // Position (stored as CENTER point in camera coordinates)
    const positionScaleRatio = imgWidth / cameraImg.naturalWidth;

    // Convert from center point to top-left corner
    const centerX = config.characterX * positionScaleRatio + config.margin;
    const centerY = config.characterY * positionScaleRatio + config.margin;
    const charX = centerX - charWidth / 2;
    const charY = centerY - charHeight / 2 + imgHeight + config.margin * 2;

    // Draw character
    ctx.drawImage(
        config.extractedCharacter,
        bounds.x, bounds.y, bounds.width, bounds.height,
        charX, charY, charWidth, charHeight
    );

    ctx.restore();

    loadingStop();
    generateImage();
};

// Extract character using IS-Net
const extractCharacter = async () => {
    if (!config.captureImage) {
        alert('请先上传动漫截图');
        return;
    }

    if (!config.cameraImage) {
        alert('请先上传实拍照片');
        return;
    }

    const statusEl = document.querySelector('.model-status');

    try {
        // Load model if needed
        if (!isnetManager.isLoaded) {
            loadingStart('加载模型中…');
            if (statusEl) {
                await isnetManager.loadModel((status) => {
                    statusEl.textContent = status;
                });
                statusEl.textContent = '模型已加载';
            } else {
                await isnetManager.loadModel();
            }
            loadingStop();
        }

        // Extract character
        if (statusEl) statusEl.textContent = '正在提取角色...';
        loadingStart('提取角色中…');
        config.extractedCharacter = await isnetManager.extractCharacter(config.captureImage);

        // Calculate bounding box
        config.characterBounds = getBoundingBox(config.extractedCharacter);

        // Set default scale and position
        config.characterScale = 1.0;

        // Reset UI
        const inputScaleEl = document.querySelector('.input-character-scale');
        const inputScaleValueEl = document.querySelector('.config-scale-value');
        if (inputScaleEl) inputScaleEl.value = 100;
        if (inputScaleValueEl) inputScaleValueEl.textContent = '100%';

        // Set position to center of photo
        config.characterX = config.cameraImage.naturalWidth / 2;
        config.characterY = config.cameraImage.naturalHeight / 2;

        loadingStop();

        // Draw result
        drawOverlayImage();

        // Show download buttons
        const downloadCharBtn = document.querySelector('.download-character-btn');
        if (downloadCharBtn) {
            downloadCharBtn.style.display = 'inline-block';
        }

        const downloadBgBtn = document.querySelector('.download-bg-btn');
        if (downloadBgBtn) {
            downloadBgBtn.style.display = 'inline-block';
        }

        const switchToAiBtn = document.querySelector('#switch-to-ai-btn');
        if (switchToAiBtn) {
            switchToAiBtn.style.display = 'inline-block';
        }

        // Update status
        if (statusEl) {
            statusEl.textContent = '✓ 提取成功！可拖动调整位置';
            statusEl.style.color = '#000000ff';
        }
    } catch (error) {
        loadingStop();
        if (statusEl) {
            statusEl.textContent = '✗ 提取失败: ' + error.message;
            statusEl.style.color = '#f44336';
        } else {
            alert('角色提取失败: ' + error.message);
        }
    }
};

// Download extracted character
const downloadCharacter = () => {
    if (!config.extractedCharacter) {
        alert('请先提取角色');
        return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const bounds = config.characterBounds || {
        x: 0,
        y: 0,
        width: config.extractedCharacter.naturalWidth,
        height: config.extractedCharacter.naturalHeight
    };

    tempCanvas.width = bounds.width;
    tempCanvas.height = bounds.height;

    tempCtx.drawImage(
        config.extractedCharacter,
        bounds.x, bounds.y, bounds.width, bounds.height,
        0, 0, bounds.width, bounds.height
    );

    tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const unix = +new Date();
        a.download = `AnimeInReal_Character_${unix}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
};

// --- Dual Mode Logic ---

const apiKeyInput = $('#gemini-api-key');
const promptInput = $('#gemini-prompt');
const aiStatusEl = $('#ai-status');
const downloadAiComparisonBtn = $('#download-ai-comparison-btn');
const downloadAiResultBtn = $('#download-ai-result-btn');
const confirmModal = $('#confirm-modal');
const confirmBtn = $('#confirm-gen-btn');
const cancelBtn = $('#cancel-gen-btn');

// Load saved API Key
const savedKey = localStorage.getItem('gemini_api_key');
if (savedKey) {
    apiKeyInput.value = savedKey;
}

// Save API Key on change
apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
});

// Switch Mode
const switchMode = (mode) => {
    config.currentMode = mode;

    // Update Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Controls
    const localControls = $('#controls-local');
    const aiControls = $('#controls-ai');
    const localBtns = $('#btns-local');
    const aiBtns = $('#btns-ai');

    if (mode === 'local') {
        localControls.style.display = 'block';
        aiControls.style.display = 'none';
        localBtns.style.display = 'flex';
        aiBtns.style.display = 'none';

        // Restore extracted character view if available
        if (config.extractedCharacter && config.captureImage && config.cameraImage) {
            drawOverlayImage();
        } else if (config.captureImage && config.cameraImage) {
            drawPlaceholderImage();
        }
    } else {
        localControls.style.display = 'none';
        aiControls.style.display = 'block';
        localBtns.style.display = 'none';
        aiBtns.style.display = 'flex';

        // Show AI result if available, otherwise placeholder
        if (config.aiResult && config.captureImage) {
            drawAiResultImage(config.aiResult);
        } else if (config.captureImage && config.cameraImage) {
            drawPlaceholderImage();
        }
    }
};

// Tab Event Listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchMode(btn.dataset.mode);
    });
});

// Switch to AI Button
$('#switch-to-ai-btn')?.addEventListener('click', () => {
    switchMode('ai');
});

// Start AI Generation (Click -> Show Modal)
$('#start-ai-gen-btn')?.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Please enter your Google AI Studio API Key');
        return;
    }

    if (!config.captureImage || !config.cameraImage) {
        alert('Missing images');
        return;
    }

    // Show Modal
    if (confirmModal) confirmModal.style.display = 'flex';
});

// Cancel
cancelBtn?.addEventListener('click', () => {
    if (confirmModal) confirmModal.style.display = 'none';
});

// Confirm -> Actually Generate
confirmBtn?.addEventListener('click', async () => {
    if (confirmModal) confirmModal.style.display = 'none';

    // UI State: Loading
    loadingStart('AI 生成中…');
    if (aiStatusEl) aiStatusEl.textContent = '正在请求 Gemini 生成...';
    $('#start-ai-gen-btn').disabled = true;
    if (downloadAiComparisonBtn) downloadAiComparisonBtn.style.display = 'none';
    if (downloadAiResultBtn) downloadAiResultBtn.style.display = 'none';

    try {
        const apiKey = apiKeyInput.value.trim();
        const animeBase64 = imageToBase64(config.captureImage);
        const bgBase64 = imageToBase64(config.cameraImage);
        const prompt = promptInput.value.trim();

        const resultBase64 = await geminiClient.generateCompositeImage(apiKey, animeBase64, bgBase64, prompt);

        // Display Result as composite
        const resultUrl = `data:image/jpeg;base64,${resultBase64}`;
        const aiImg = new Image();
        aiImg.onload = () => {
            drawAiResultImage(aiImg);

            // Show buttons
            if (downloadAiComparisonBtn) downloadAiComparisonBtn.style.display = 'inline-flex';
            if (downloadAiResultBtn) downloadAiResultBtn.style.display = 'inline-flex';

            if (aiStatusEl) aiStatusEl.textContent = '✓ 生成成功！';
        };
        aiImg.src = resultUrl;

    } catch (error) {
        if (aiStatusEl) {
            aiStatusEl.textContent = '✗ 生成失败: ' + error.message;
            aiStatusEl.style.color = '#f44336';
        } else {
            alert('AI 生成失败: ' + error.message);
        }
    } finally {
        loadingStop();
        $('#start-ai-gen-btn').disabled = false;
    }
});

// AI Download Listeners
downloadAiComparisonBtn?.addEventListener('click', () => {
    const url = canvas.toDataURL('image/png', 0.9);
    const a = document.createElement('a');
    a.download = `AnimeInReal_AI_Comparison_${+new Date()}.png`;
    a.href = url;
    a.click();
});

downloadAiResultBtn?.addEventListener('click', () => {
    if (!config.aiResult) return;
    const url = config.aiResult.src;
    const a = document.createElement('a');
    a.download = `AnimeInReal_AI_Result_${+new Date()}.png`;
    a.href = url;
    a.click();
});

// Export functions for global access
window.extractCharacter = extractCharacter;
window.downloadCharacter = downloadCharacter;

// Export for module usage
export {
    config,
    loadCaptureImageURL,
    loadCameraImageURL,
    extractCharacter,
    drawOverlayImage,
    drawPlaceholderImage,
    drawAiResultImage
};
