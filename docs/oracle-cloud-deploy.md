# Oracle Cloud AMD VM 部署指南

## AMD vs ARM 差異

| | AMD (E2.1.Micro) | ARM (Ampere A1) |
|---|---|---|
| 架構 | x86_64（傳統伺服器架構） | AArch64（ARM 架構） |
| 免費資源 | 2 台 VM，各 1GB RAM | 總計 4 OCPU、24GB RAM |
| 穩定性 | **穩定，Oracle 不會回收** | 高風險，Oracle 常以 capacity 為由強制刪除 |
| Java 相容性 | 原生執行，無相容問題 | 需確認 JDK arm64 版本 |
| 建議 | **✅ 長期部署首選** | ❌ 免費帳號不建議 |

> **結論**：AMD 資源雖少（1GB RAM），但永遠不會被 Oracle 回收，適合長期穩定運行。

---

## 架構概覽

```
使用者手機/電腦
      ↓ HTTPS（自動）
Cloudflare Tunnel
      ↓
Oracle Cloud AMD VM（Ubuntu 22.04）
  ├── Nginx（反向代理）
  ├── Spring Boot 8080（systemd 管理）
  └── MySQL 8.0（本機）
```

---

## 前置準備

- 一張信用卡（驗證用，不會扣款）
- 你的電腦上已可正常 build 專案：`./gradlew build`
- SSH client（Windows 內建 PowerShell 即可）

---

## 第一步：建立 Oracle Cloud 帳號

1. 前往 [cloud.oracle.com](https://cloud.oracle.com) → **Start for free**
2. 填寫資料，**Home Region 選 South Korea（首爾）或 Japan（東京）**，離台灣最近
   > ⚠️ Home Region 選定後**無法更改**
3. 信用卡驗證（會暫扣 $1 USD 後退回）
4. 等待帳號啟用（約 10–30 分鐘）

---

## 第二步：建立 AMD VM

1. 登入後 → 左上選單 → **Compute → Instances → Create Instance**

2. **設定項目：**

   | 欄位 | 設定值 |
   |------|--------|
   | Name | `small-peanut-server` |
   | Image | Ubuntu 22.04（點 **Change image** 選） |
   | Shape | 點 **Change shape** → Specialty and previous gen → **VM.Standard.E2.1.Micro**（標示 Always Free） |
   | SSH Key | 點 **Generate a key pair** 並下載私鑰 `.key` 檔 |

3. 其餘設定保留預設，點 **Create**

4. 等待 VM 狀態變為 **Running**（約 2 分鐘）

5. 記下 **Public IP address**（後續步驟都會用到）

---

## 第三步：開放 Oracle 防火牆（Security List）

Oracle 雲端有自己的防火牆，預設只開 22 port（SSH）。

1. VM 頁面 → **Subnet** 連結 → **Security List** → **Default Security List**

2. 點 **Add Ingress Rules**，新增兩條規則：

   | Source CIDR | Protocol | Port |
   |-------------|----------|------|
   | `0.0.0.0/0` | TCP | `80` |
   | `0.0.0.0/0` | TCP | `443` |

   > Spring Boot 的 8080 port 不需對外開放，Nginx 會負責轉發

---

## 第四步：SSH 連線進入 VM

```powershell
# 設定私鑰權限（Windows PowerShell）
icacls "C:\path\to\your-key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"

# 連線（換成你的 Public IP）
ssh -i "C:\path\to\your-key.key" ubuntu@<YOUR_PUBLIC_IP>
```

---

## 第五步：設定 VM 內部防火牆（iptables）

Oracle VM 的 Ubuntu 預設有 **iptables** 阻擋外部流量，需手動開放。

```bash
# 開放 80、443 port
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# 安裝持久化工具，讓規則重開機後仍有效
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 第六步：安裝 Java 21

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-21-jdk

# 驗證
java -version
# 應輸出：openjdk version "21.x.x"
```

---

## 第七步：安裝並設定 MySQL 8.0

```bash
# 安裝
sudo apt install -y mysql-server

# 啟動並設定開機自動啟動
sudo systemctl enable --now mysql

# 安全性初始化（建議全部選 Y）
sudo mysql_secure_installation
```

**建立資料庫與使用者：**

```bash
sudo mysql
```

```sql
CREATE DATABASE small_peanut CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'peanut'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON small_peanut.* TO 'peanut'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**調整 MySQL 記憶體用量（1GB 機器必做）：**

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

在 `[mysqld]` 區段加入：

```ini
innodb_buffer_pool_size = 128M
innodb_log_file_size    = 32M
max_connections         = 50
tmp_table_size          = 16M
max_heap_table_size     = 16M
```

```bash
sudo systemctl restart mysql
```

---

## 第八步：部署 Spring Boot JAR

**在你的本機（Windows PowerShell）執行：**

```powershell
# 1. 打包（包含前端 build）
cd D:\small-peanut
./gradlew build

# 2. 上傳 JAR 到 VM
scp -i "C:\path\to\your-key.key" `
    build/libs/small-peanut-*.jar `
    ubuntu@<YOUR_PUBLIC_IP>:~/app.jar
```

---

## 第九步：設定 systemd 服務（開機自動啟動）

**在 VM 上執行：**

```bash
sudo nano /etc/systemd/system/small-peanut.service
```

貼入以下內容（修改密碼）：

```ini
[Unit]
Description=Small Peanut Spring Boot App
After=network.target mysql.service
Requires=mysql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/java \
  -Xmx400m -Xms200m \
  -XX:+UseG1GC \
  -XX:MaxMetaspaceSize=150m \
  -jar /home/ubuntu/app.jar
Restart=always
RestartSec=15
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/small_peanut"
Environment="SPRING_DATASOURCE_USERNAME=peanut"
Environment="SPRING_DATASOURCE_PASSWORD=your_strong_password_here"
Environment="SPRING_JPA_HIBERNATE_DDL_AUTO=update"

[Install]
WantedBy=multi-user.target
```

```bash
# 啟用並啟動
sudo systemctl daemon-reload
sudo systemctl enable --now small-peanut

# 確認運行狀態
sudo systemctl status small-peanut

# 即時查看 log
sudo journalctl -u small-peanut -f
```

> Spring Boot 首次啟動約需 30–60 秒（1GB RAM 較慢）

---

## 第十步：安裝 Nginx（反向代理）

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

```bash
sudo nano /etc/nginx/sites-available/small-peanut
```

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://localhost:8080;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/small-peanut /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t          # 測試設定是否正確
sudo systemctl reload nginx
```

**此時可用 `http://<YOUR_PUBLIC_IP>` 驗證 App 是否正常運行。**

---

## 第十一步：設定 HTTPS（Cloudflare Tunnel）

HTTPS 是 PWA 的必要條件。使用 Cloudflare Tunnel 不需要網域名稱、不需要設定 SSL 憑證。

### 11-1 安裝 cloudflared

```bash
# 在 VM 上執行
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
  -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 11-2 登入 Cloudflare（免費帳號即可）

```bash
cloudflared tunnel login
```

終端機會顯示一個 URL，複製到瀏覽器開啟並授權。

### 11-3 建立 Tunnel

```bash
cloudflared tunnel create small-peanut
```

記下輸出的 **Tunnel ID**（格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 11-4 設定 Tunnel

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/ubuntu/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - service: http://localhost:80
```

### 11-5 設定為 systemd 服務（開機自動啟動）

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

### 11-6 取得公開 HTTPS 網址

```bash
# 檢視 Tunnel 狀態，找到分配的 URL
cloudflared tunnel info small-peanut
```

你會得到一個類似 `https://small-peanut-xxxx.cfargotunnel.com` 的網址，這就是你的公開入口。

---

## 第十二步：PWA 設定（前端）

**在本機 `frontend/` 目錄執行：**

```bash
npm install -D vite-plugin-pwa
```

修改 `frontend/vite.config.js`：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: '育嬰紀錄',
        short_name: '小花生',
        description: '寶寶育嬰紀錄 App',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: { proxy: { '/api': 'http://localhost:8080' } },
})
```

將 App 圖示（192×192 和 512×512 的 PNG）放到 `frontend/public/` 目錄。

---

## 日常更新部署流程

每次修改程式碼後，用以下流程更新：

```powershell
# 1. 本機 build
cd D:\small-peanut
./gradlew build

# 2. 上傳新 JAR
scp -i "C:\path\to\your-key.key" `
    build/libs/small-peanut-*.jar `
    ubuntu@<YOUR_PUBLIC_IP>:~/app.jar

# 3. 重啟服務（SSH 連入後執行）
ssh -i "C:\path\to\your-key.key" ubuntu@<YOUR_PUBLIC_IP> `
    "sudo systemctl restart small-peanut"
```

---

## 常用維護指令

```bash
# 查看 App 狀態
sudo systemctl status small-peanut

# 即時 log（Ctrl+C 離開）
sudo journalctl -u small-peanut -f

# 重啟 App
sudo systemctl restart small-peanut

# 查看記憶體使用量
free -h

# 查看 Tunnel 狀態
sudo systemctl status cloudflared

# MySQL 連線
mysql -u peanut -p small_peanut
```

---

## 常見問題排除

### App 啟動後無法連線
```bash
# 確認 8080 是否有在監聽
ss -tlnp | grep 8080

# 確認 Nginx 是否正常
sudo nginx -t
sudo systemctl status nginx
```

### 記憶體不足（OOM）
```bash
# 確認目前記憶體用量
free -h

# 如果 Spring Boot 被 OOM kill，調整 JVM 參數（在 service 檔中）
# -Xmx 調低到 350m，MySQL innodb_buffer_pool_size 調低到 96M
```

### 忘記 VM 的 Public IP
在 Oracle Cloud 控制台 → Compute → Instances → 點選 VM → 右上角 **Public IP**

### Cloudflare Tunnel 斷線
```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -f
```
