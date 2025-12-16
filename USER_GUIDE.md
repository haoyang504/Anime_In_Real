# 使用指南 - 動漫角色疊加功能

## 🚀 快速開始

### 啟動開發服務器

```bash
npm run dev
```

服務器將在 http://localhost:8000 啟動

### 編譯 CSS（如果修改了 style.less）

```bash
npm run compile-css
```

---

## 📖 功能說明

### 兩種模式

#### 1. 對比模式（原有功能）
- 上下或左右並排顯示動漫截圖和實拍照片
- 可調整邊框、底色、方向

#### 2. 疊加模式（新功能）⭐
- 將動漫角色從截圖中提取出來
- 疊加到實拍照片上
- 可調整角色位置、大小、透明度

---

## 🎯 疊加模式使用步驟

### 步驟 1: 切換到疊加模式
點擊頁面頂部的 **"疊加模式"** 按鈕

### 步驟 2: 上傳動漫截圖
- 點擊圖片區域或拖拽圖片上傳動漫截圖
- 系統會自動識別這是截圖

### 步驟 3: 提取角色
- 點擊 **"提取動漫角色"** 按鈕
- 首次使用會自動下載 IS-Net 模型（約 20-30MB）
- 等待模型加載和角色提取完成

### 步驟 4: 上傳實拍照片
- 再次點擊圖片區域上傳您的實拍照片
- 提取的角色會自動疊加到照片上

### 步驟 5: 調整角色
- **拖動圖片**：調整角色位置
- **角色大小滑桿**：調整角色大小（10%-200%）
- **透明度滑桿**：調整角色透明度（0%-100%）

### 步驟 6: 保存圖片
點擊 **"保存圖片"** 按鈕下載最終作品

---

## 🔧 技術細節

### 核心技術
- **IS-Net (Anime)**: 專門為動漫角色訓練的分割模型
- **@huggingface/transformers**: 在瀏覽器中運行機器學習模型
- **Vite**: 現代化的前端構建工具
- **ONNX Runtime Web**: 在瀏覽器中執行 ONNX 模型

### 文件結構
```
e:\Anime_in_real\
├── index.html              # 主頁面
├── main.js                 # 主邏輯（模式切換、繪圖）
├── isnet-manager.js        # IS-Net 模型管理
├── interactions.js         # 用戶交互（拖拽、點擊）
├── style.less              # 樣式源文件
├── style.css               # 編譯後的樣式
├── vite.config.js          # Vite 配置
└── package.json            # 項目配置
```

### 模型加載機制
- **懶加載**: 只在切換到疊加模式並點擊提取按鈕時才加載模型
- **緩存**: 模型加載後會保留在內存中，無需重複下載
- **進度提示**: 加載過程中會顯示狀態信息

---

## 🎨 自定義與擴展

### 修改樣式
編輯 `style.less` 文件，然後運行：
```bash
npm run compile-css
```

### 調整模型參數
在 `isnet-manager.js` 中可以調整：
- 模型精度（dtype）
- 圖像處理參數

### 添加新功能
主要邏輯在 `main.js` 中，可以添加：
- 更多濾鏡效果
- 陰影效果
- 多角色疊加

---

## ⚠️ 注意事項

### 瀏覽器兼容性
- 推薦使用最新版 Chrome、Firefox、Edge
- Safari 需要較新版本
- 需要支持 ES Modules 和 WebGL

### 性能考慮
- 首次加載模型需要下載約 20-30MB
- 角色提取時間取決於圖片大小（通常 2-5 秒）
- 建議圖片不要過大（建議 < 2000px）

### 隱私保護
- 所有處理都在瀏覽器本地完成
- 圖片不會上傳到任何服務器
- 模型從 Hugging Face CDN 下載

---

## 🐛 故障排除

### 模型加載失敗
- 檢查網絡連接
- 刷新頁面重試
- 清除瀏覽器緩存

### 角色提取效果不佳
- 確保動漫截圖清晰
- 角色與背景對比度要高
- 避免過於複雜的背景

### 拖動不響應
- 確保已在疊加模式
- 確保已提取角色
- 確保已上傳實拍照片

---

## 📦 部署到生產環境

### 構建生產版本
```bash
npm run build
```

生成的文件在 `dist/` 目錄中

### 部署到靜態服務器
將 `dist/` 目錄的內容上傳到任何靜態服務器：
- GitHub Pages
- Netlify
- Vercel
- 自己的 Nginx/Apache 服務器

---

## 🙏 致謝

- 原始項目: [itorr/image-merge](https://github.com/itorr/image-merge)
- IS-Net 模型: [SkyTNT/anime-segmentation](https://github.com/SkyTNT/anime-segmentation)
- Hugging Face 模型: [BritishWerewolf/IS-Net-Anime](https://huggingface.co/BritishWerewolf/IS-Net-Anime)
