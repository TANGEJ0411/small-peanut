# Mac 本機部署指南

本機筆電當伺服器，使用 Docker Compose 跑 MySQL + Spring Boot，Cloudflare Tunnel 提供 HTTPS 公開網址。

## 架構

```
手機/電腦
  ↓ HTTPS（自動）
Cloudflare Tunnel
  ↓
MacBook（常駐開機）
  └── Docker Compose
      ├── MySQL 8.0（內網，不對外）
      └── Spring Boot 8080（含前端靜態檔）
```

---

## 前置需求

- MacBook 已安裝 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- 免費 [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)
- Mac 設定為「不自動睡眠」（系統設定 → 省電 → 關閉「閒置時關閉顯示器」）

---

## 第一步：取得程式碼

在 Mac 上選一種方式：

**方式 A：git clone（推薦）**
```bash
git clone <你的 repo URL>
cd small-peanut
```

**方式 B：從 Windows 傳過來**
```powershell
# Windows PowerShell 執行
scp -r D:\small-peanut user@<mac-ip>:~/small-peanut
```

---

## 第二步：設定環境變數

```bash
cd ~/small-peanut
cp .env.example .env
nano .env
```

把兩個密碼改成自訂的強密碼：

```
DB_ROOT_PASSWORD=你的root密碼
DB_PASSWORD=你的應用程式密碼
```

> `.env` 已在 `.gitignore` 中，不會被 commit。

---

## 第三步：打包並啟動

**方式 A：在 Mac 本機 build（需安裝 Java 21）**
```bash
cd ~/small-peanut
./gradlew build
docker compose -f docker-compose.prod.yml up -d --build
```

**方式 B：在 Windows build 後傳 JAR（不需在 Mac 裝 Java）**
```powershell
# Windows PowerShell
cd D:\small-peanut
./gradlew build
scp build/libs/small-peanut-*.jar user@<mac-ip>:~/small-peanut/build/libs/
```
```bash
# Mac 上執行
cd ~/small-peanut
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 第四步：確認服務正常

```bash
# 查看啟動狀態
docker compose -f docker-compose.prod.yml ps

# 看 app log（等到出現 "Started SmallPeanutApplication" 才算好）
docker compose -f docker-compose.prod.yml logs -f app
```

瀏覽器開 `http://localhost:8080` 確認頁面正常。

---

## 第五步：設定 Cloudflare Tunnel（HTTPS + 外部存取）

PWA 安裝到手機桌面需要 HTTPS，Cloudflare Tunnel 免費提供。

```bash
# 安裝 cloudflared
brew install cloudflared

# 登入 Cloudflare（會開瀏覽器授權）
cloudflared tunnel login

# 建立 Tunnel
cloudflared tunnel create small-peanut
```

建立設定檔：
```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

貼入以下內容（把 `<TUNNEL_ID>` 換成上一步輸出的 ID）：
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /Users/<你的使用者名稱>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - service: http://localhost:8080
```

設定開機自動啟動：
```bash
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

取得公開網址：
```bash
cloudflared tunnel info small-peanut
```

會得到類似 `https://small-peanut-xxxx.cfargotunnel.com` 的永久網址。

---

## 第六步：PWA 圖示（安裝到手機桌面用）

在 `frontend/public/` 放兩個 PNG 檔：

| 檔名 | 尺寸 |
|------|------|
| `icon-192.png` | 192 × 192 px |
| `icon-512.png` | 512 × 512 px |

沒有現成圖示的話，可以用 [realfavicongenerator.net](https://realfavicongenerator.net) 從 SVG 轉換。

圖示放好後需要重新 build 並部署（見下方更新流程）。

---

## 日常更新流程

每次修改程式碼後：

```powershell
# Windows 上 build
cd D:\small-peanut
./gradlew build
```

```bash
# Mac 上更新（傳入新 JAR 後執行）
cd ~/small-peanut
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 常用維護指令

```bash
# 查看所有 container 狀態
docker compose -f docker-compose.prod.yml ps

# 即時看 app log
docker compose -f docker-compose.prod.yml logs -f app

# 重啟 app（不重啟 MySQL）
docker compose -f docker-compose.prod.yml restart app

# 停止全部
docker compose -f docker-compose.prod.yml down

# 查看記憶體用量
docker stats

# 進入 MySQL
docker compose -f docker-compose.prod.yml exec db mysql -u peanut -p small_peanut

# 查看 Tunnel 狀態
sudo launchctl list | grep cloudflare
```

---

## 常見問題

### App 啟動失敗
```bash
docker compose -f docker-compose.prod.yml logs app
# 看錯誤訊息，通常是 DB 還沒 ready（healthcheck 等待中）
```

### 外部連不進來
```bash
# 確認 Tunnel 在跑
sudo launchctl list | grep cloudflare

# 重啟 Tunnel
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared
```

### MySQL 資料在哪
資料存在 Docker volume `small-peanut_mysql_data`，`docker compose down` 不會刪除，只有 `docker compose down -v` 才會清除。
