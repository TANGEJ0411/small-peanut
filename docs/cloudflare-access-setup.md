# Cloudflare Access 設定指南

本 App 部署於本機 Docker + Cloudflare Tunnel，透過 Cloudflare Access 限制只有授權成員能進入，不需修改任何程式碼。

---

## 架構說明

```
Internet → Cloudflare Access（身份驗證）→ Cloudflare Tunnel → 本機 Docker → Spring Boot
```

LINE Bot webhook（`/api/line/webhook`）設定 Bypass，讓 LINE 平台可直接打進來，不受 Access 擋住。

---

## 設定步驟

### 1. 進入 Zero Trust Dashboard

前往 `dash.cloudflare.com` → 選你的帳號 → 左側選單點 **Zero Trust**

---

### 2. 建立 Application

**Access → Applications → Add an application → Self-hosted**

| 欄位 | 填入 |
|------|------|
| Application name | `Small Peanut`（隨意） |
| Session Duration | `24h`（或 `1 week`，看使用習慣） |
| Application domain | 你的 Cloudflare Tunnel domain，例如 `baby.example.com` |

---

### 3. 設定 Allow Policy

**Policy name**：`Allow family`

**Action**：`Allow`

**Include 規則**：

```
Selector: Emails
Value:
  user1@gmail.com
  user2@gmail.com
  user3@gmail.com
  user4@gmail.com
```

將 4 位成員的 email 逐一填入。

---

### 4. 設定 LINE Webhook Bypass Policy（重要）

在同一個 Application 裡，新增第二條 Policy：

| 欄位 | 填入 |
|------|------|
| Policy name | `Bypass LINE webhook` |
| Action | `Bypass` |
| Path | `/api/line/webhook` |

> **注意**：Bypass policy 必須排在 Allow policy **上面**，Cloudflare 依順序比對。

---

### 5. 驗證流程

設定完成後：

1. 開無痕視窗進入你的網址
2. 應跳出 Cloudflare 的 email 輸入頁
3. 輸入 email → 收 OTP → 驗證成功 → 進入 App
4. 測試 LINE Bot 推播，確認 webhook 未被攔截

---

## 使用者注意事項

- 4 位成員各自用**自己的 email** 第一次登入驗證
- OTP 信件從 `no-reply@notify.cloudflare.com` 寄出，請加入白名單避免落入垃圾信件匣
- Session 到期後需重新收 OTP，不需重新設定

---

## 費用

Cloudflare Access 免費方案支援最多 **50 個 user**，4 人使用完全免費。
