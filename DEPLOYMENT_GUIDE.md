# 部署指南 (Deployment Guide)

## 🚀 推薦：使用 GitHub Pages (免費且自動化)

本項目已配置好 GitHub Actions，可以實現自動構建和部署。

### 步驟 1: 準備 GitHub 倉庫
1. 在 GitHub 上創建一個新的倉庫（例如命名為 `anime-in-real`）。
2. 將本地代碼推送到該倉庫：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/您的用戶名/倉庫名.git
   git push -u origin main
   ```

### 步驟 2: 配置 GitHub Pages
1. 進入 GitHub 倉庫頁面。
2. 點擊頂部的 **Settings** (設置)。
3. 在左側菜單中點擊 **Pages**。
4. 在 **Build and deployment** (構建與部署) 部分：
   - **Source** 選擇 **GitHub Actions**。
5. 頁面會自動保存設置。

### 步驟 3: 等待部署
1. 點擊頂部的 **Actions** 標籤。
2. 您會看到一個名為 "Deploy to GitHub Pages" 的工作流正在運行。
3. 等待它變成綠色（成功）。
4. 點擊該工作流，在 "deploy" 任務下，您會看到生成的網站鏈接（例如 `https://您的用戶名.github.io/倉庫名/`）。

---

## 📍 本地預覽 (開發模式)

如果您只是想在本地運行：

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

瀏覽器訪問: http://localhost:8000

---

## 🛠️ 手動構建 (高級)

如果您想部署到其他服務器（如 Nginx）：

1. **構建項目**
   ```bash
   npm run build
   ```
   這將在 `dist` 目錄下生成所有靜態文件。

2. **部署 `dist` 目錄**
   將 `dist` 目錄中的所有文件上傳到您的服務器根目錄即可。

