
export const translations = {
    'zh-CN': {
        'app.title': '圣地巡礼角色实景合成器',
        'header.title': '圣地巡礼角色实景合成器',
        'tab.local': '本地提取',
        'tab.ai': 'AI 生成 (Nano Banana Pro 🍌)',
        'label.margin': '边框',
        'label.background': '底色',
        'btn.extract': '提取角色',
        'label.scale': '大小',
        'label.opacity': '透明',
        'input.apikey.label': 'Google AI Studio API Key <a href="https://ai.google.dev/gemini-api/docs/pricing?hl=zh-cn#gemini-3-pro-image-preview" target="_blank">（生成一张图片约$0.24美元）</a>',
        'input.apikey.placeholder': '请输入您的 Google AI Studio API Key',
        'input.prompt.label': '提示词（Prompt）',
        'btn.start_ai': '开始 AI 生成',
        'btn.save_comparison': '保存对比图片',
        'btn.save_bg_only': '仅保存实景合成图片',
        'btn.save_char_only': '仅保存提取角色',
        'btn.switch_to_ai': '对结果不满意？尝试 AI 生成',
        'btn.reset': '重新开始',
        'text.map_link': '在地图中寻找圣地',
        'text.intro': '将动漫角色放置在圣地巡礼实拍照片中！',
        'text.disclaimer': '本工具仅供非商业用途，动画截图版权归制作委员会所有。',
        'footer.credit': '本项目基于Image Merge项目开发',
        'modal.confirm.title': '确认生成？',
        'modal.confirm.desc': '此功能需要使用您自己的 Google AI Studio API Key',
        'modal.confirm.warning': '⚠️ 生成一张图片约需花费 $0.24 美元',
        'btn.cancel': '取消',
        'btn.confirm': '确认生成',
        'msg.upload_photo_first': '请先上传实拍照片',
        'msg.extract_char_first': '请先提取动漫角色',
        'msg.upload_anime_first': '请先上传动漫截图',
        'msg.model_loading': '加载模型中…',
        'msg.model_loaded': '模型已加载',
        'msg.extracting': '正在提取角色...',
        'msg.extract_success': '✓ 提取成功！可拖动调整位置',
        'msg.extract_fail': '✗ 提取失败: ',
        'msg.ai_generating': 'AI 生成中…',
        'msg.ai_requesting': '正在请求 Gemini 生成...',
        'msg.ai_success': '✓ 生成成功！',
        'msg.ai_fail': '✗ 生成失败: ',
        'canvas.upload_photo': '点选或拖拽上传照片',
        'canvas.upload_screenshot': '点选或拖拽上传截图',
        'loading.generating': '生成中…',
        'loading.loading': '加载中…',
        'link.apikey': '如何获取 API Key',
        'btn.lang_toggle': 'English'
    },
    'en-US': {
        'app.title': 'Anime Pilgrimage Character Compositor',
        'header.title': 'Anime Pilgrimage Character Compositor',
        'tab.local': 'Local Extract',
        'tab.ai': 'AI Generate (Nano Banana Pro 🍌)',
        'label.margin': 'Border',
        'label.background': 'Bg Color',
        'btn.extract': 'Extract Character',
        'label.scale': 'Scale',
        'label.opacity': 'Opacity',
        'input.apikey.label': 'Google AI Studio API Key <a href="https://ai.google.dev/gemini-api/docs/pricing?hl=en#gemini-3-pro-image-preview" target="_blank">(~$0.24 per image)</a>',
        'input.apikey.placeholder': 'Enter your Google AI Studio API Key',
        'input.prompt.label': 'Prompt',
        'btn.start_ai': 'Start AI Generation',
        'btn.save_comparison': 'Save Pilgrimage Comparison',
        'btn.save_bg_only': 'Save Pilgrimage Composite Only',
        'btn.save_char_only': 'Save Character Only',
        'btn.switch_to_ai': 'Not satisfied? Try AI Generation',
        'btn.reset': 'Reset',
        'text.map_link': 'Find pilgrimage locations on map',
        'text.intro': 'Place anime characters into real pilgrimage photos!',
        'text.disclaimer': 'Non-commercial use only. All rights reserved by the Production Committee.',
        'footer.credit': 'Based on Image Merge project',
        'modal.confirm.title': 'Confirm Generation?',
        'modal.confirm.desc': 'This feature requires your own Google AI Studio API Key',
        'modal.confirm.warning': '⚠️ Generating one image costs approximately $0.24 USD',
        'btn.cancel': 'Cancel',
        'btn.confirm': 'Confirm',
        'msg.upload_photo_first': 'Please upload a real photo first',
        'msg.extract_char_first': 'Please extract the anime character first',
        'msg.upload_anime_first': 'Please upload an anime screenshot first',
        'msg.model_loading': 'Loading model...',
        'msg.model_loaded': 'Model loaded',
        'msg.extracting': 'Extracting character...',
        'msg.extract_success': '✓ Extraction successful! Drag to adjust position',
        'msg.extract_fail': '✗ Extraction failed: ',
        'msg.ai_generating': 'AI Generating...',
        'msg.ai_requesting': 'Requesting Gemini generation...',
        'msg.ai_success': '✓ Generation successful!',
        'msg.ai_fail': '✗ Generation failed: ',
        'canvas.upload_photo': 'Click or drag to upload photo',
        'canvas.upload_screenshot': 'Click or drag to upload screenshot',
        'loading.generating': 'Generating...',
        'loading.loading': 'Loading...',
        'link.apikey': 'How to get API Key',
        'btn.lang_toggle': '中文'
    }
};

let currentLang = 'zh-CN';

export const getLang = () => currentLang;

export const setLang = (lang) => {
    if (translations[lang]) {
        currentLang = lang;
        updatePageContent();
        localStorage.setItem('app_language', lang);
    }
};

export const t = (key) => {
    return translations[currentLang][key] || key;
};

export const updatePageContent = () => {
    document.documentElement.lang = currentLang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.getAttribute('placeholder')) {
                    el.setAttribute('placeholder', translations[currentLang][key]);
                }
            } else {
                el.innerHTML = translations[currentLang][key];
            }
        }
    });

    // Update specific attributes like placeholder if needed
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.setAttribute('placeholder', translations[currentLang][key]);
        }
    });

    // Trigger custom event for canvas redraws or other JS updates
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
};

// Initialize language from local storage or default
export const initI18n = () => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    }
    updatePageContent();
};
