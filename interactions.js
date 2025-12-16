import { config, loadCaptureImageURL, loadCameraImageURL, drawOverlayImage, drawPlaceholderImage } from './main.js';

const $ = document.querySelector.bind(document);
const outputEl = $('.output-image');

// Throttle utility
const throttle = (fn, wait) => {
    let timer = null;
    return (...args) => {
        if (timer) return;
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, wait);
    };
};

// Click to upload
outputEl.addEventListener('click', (clickEvent) => {
    // Prevent upload if character is already extracted
    if (config.extractedCharacter) {
        return;
    }

    const rect = outputEl.getBoundingClientRect();
    const clickY = clickEvent.clientY - rect.top;
    const halfHeight = rect.height / 2;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.match('image.*')) return;

        const reader = new FileReader();
        reader.onload = evt => {
            const url = evt.target.result;

            if (clickY < halfHeight) {
                // Top half - screenshot
                loadCaptureImageURL(url);
            } else {
                // Bottom half - photo
                loadCameraImageURL(url);
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
});

// Drag and drop
outputEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
});

outputEl.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent upload if character is already extracted
    if (config.extractedCharacter) {
        return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.match('image.*')) return;

    const reader = new FileReader();
    reader.onload = evt => {
        const url = evt.target.result;

        // Determine which image based on drop position
        const rect = outputEl.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const halfHeight = rect.height / 2;

        if (dropY < halfHeight) {
            // Top half - screenshot
            loadCaptureImageURL(url);
        } else {
            // Bottom half - photo
            loadCameraImageURL(url);
        }
    };
    reader.readAsDataURL(file);
});

// Paste to upload
document.addEventListener('paste', e => {
    // Prevent upload if character is already extracted
    if (config.extractedCharacter) {
        return;
    }

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = evt => {
                // Default to screenshot
                loadCaptureImageURL(evt.target.result);
            };
            reader.readAsDataURL(file);
            break;
        }
    }
});

// Margin control
const inputRangeMarginOverlayEl = $('.input-range-margin-overlay');
const inputRangeValueOverlayEl = $('.config-margin-value-overlay');

if (inputRangeMarginOverlayEl) {
    inputRangeMarginOverlayEl.addEventListener('input', throttle(e => {
        const v = +e.target.value;
        config.margin = v;
        inputRangeValueOverlayEl.innerText = v;

        if (config.extractedCharacter) {
            drawOverlayImage();
        } else if (config.captureImage && config.cameraImage) {
            drawPlaceholderImage();
        } else if (config.captureImage) {
            loadCaptureImageURL(config.captureImage.src);
        } else if (config.cameraImage) {
            loadCameraImageURL(config.cameraImage.src);
        }
    }, 300));
}

// Background color control
const inputBGColorOverlayEl = $('.input-background-color-overlay');
const inputColorValueOverlayEl = $('.config-background-color-overlay');

if (inputBGColorOverlayEl) {
    inputBGColorOverlayEl.addEventListener('input', throttle(e => {
        const v = e.target.value;
        config.background = v;
        inputColorValueOverlayEl.innerText = v;

        if (config.extractedCharacter) {
            drawOverlayImage();
        } else if (config.captureImage && config.cameraImage) {
            drawPlaceholderImage();
        } else if (config.captureImage) {
            loadCaptureImageURL(config.captureImage.src);
        } else if (config.cameraImage) {
            loadCameraImageURL(config.cameraImage.src);
        }
    }, 10));
}

// Character scale control
const inputScaleEl = $('.input-character-scale');
const inputScaleValueEl = $('.config-scale-value');

if (inputScaleEl) {
    inputScaleEl.addEventListener('input', throttle(e => {
        if (!config.extractedCharacter) return;

        const v = +e.target.value;
        config.characterScale = v / 100;
        inputScaleValueEl.innerText = v + '%';

        drawOverlayImage();
    }, 10));
}

// Character opacity control
const inputOpacityEl = $('.input-character-opacity');
const inputOpacityValueEl = $('.config-opacity-value');

if (inputOpacityEl) {
    inputOpacityEl.addEventListener('input', throttle(e => {
        if (!config.extractedCharacter) return;

        const v = +e.target.value;
        config.characterOpacity = v / 100;
        inputOpacityValueEl.innerText = v + '%';

        drawOverlayImage();
    }, 10));
}

// Character dragging
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let charStartX = 0;
let charStartY = 0;
let rafId = null;

outputEl.addEventListener('mousedown', e => {
    if (!config.extractedCharacter) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    charStartX = config.characterX;
    charStartY = config.characterY;

    outputEl.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    if (rafId) {
        cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
        const rect = outputEl.getBoundingClientRect();
        const scaleX = config.cameraImage.naturalWidth / rect.width;
        const scaleY = config.cameraImage.naturalHeight / rect.height;

        const deltaX = (e.clientX - dragStartX) * scaleX;
        const deltaY = (e.clientY - dragStartY) * scaleY;

        config.characterX = charStartX + deltaX;
        config.characterY = charStartY + deltaY;

        drawOverlayImage();
        rafId = null;
    });
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        outputEl.style.cursor = 'pointer';

        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
});

// Download button
const downloadBtn = $('.download-btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = $('.output-image');

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const src = canvas.toDataURL('image/png', 0.9);
        const unix = +new Date();
        const uuid = unix.toString(36);
        const fileName = `[神奇海螺][叠加图生成器][${uuid}].png`;

        downloadBtn.download = fileName;
        downloadBtn.href = src;
    });
}

// Reset button
const resetBtn = document.querySelector('.reset-btn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        // Reload the page to reset everything
        window.location.reload();
    });
}



// Download background button (Save Composite)
const downloadBgBtn = document.querySelector('.download-bg-btn');
if (downloadBgBtn) {
    downloadBgBtn.addEventListener('click', () => {
        if (!config.cameraImage) {
            alert('请先上传实拍照片');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use natural dimensions of the camera image
        canvas.width = config.cameraImage.naturalWidth;
        canvas.height = config.cameraImage.naturalHeight;

        // Draw camera image
        ctx.drawImage(config.cameraImage, 0, 0);

        // Draw character if exists
        if (config.extractedCharacter) {
            const bounds = config.characterBounds || {
                x: 0,
                y: 0,
                width: config.extractedCharacter.naturalWidth,
                height: config.extractedCharacter.naturalHeight
            };

            // Calculate scale relative to camera image width
            let scaleRatio = 1;
            if (config.captureImage) {
                scaleRatio = canvas.width / config.captureImage.naturalWidth;
            }

            const charWidth = bounds.width * config.characterScale * scaleRatio;
            const charHeight = bounds.height * config.characterScale * scaleRatio;

            // config.characterX/Y are center coordinates in camera image space
            const charX = config.characterX - charWidth / 2;
            const charY = config.characterY - charHeight / 2;

            ctx.globalAlpha = config.characterOpacity;
            ctx.drawImage(
                config.extractedCharacter,
                bounds.x, bounds.y, bounds.width, bounds.height,
                charX, charY, charWidth, charHeight
            );
        }

        const link = document.createElement('a');
        link.download = `real_scene_composite_${+new Date()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Load default image
const urlParams = new URLSearchParams(window.location.search);
loadCaptureImageURL(urlParams.get('url') || '7eyih3xg.jpg');
