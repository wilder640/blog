---
title: FreeRADIUS + PrivacyIDEA
description: 紀錄如何在 Ubuntu 上安裝 FreeRADIUS，並整合 PrivacyIDEA 來啟用OTP 雙因子驗證。
date: 2025-03-19
categories:
    - FreeRadius
tags:
    - FreeRadius
    - PrivacyIDEA
comment: true
banner: img.png
draft: true 
---

## 1. 環境說明

- 作業系統：5.7.1
- FreeRadius：6.10.1
- PrivacyIDEA：20230302.103003

## 安裝 FreeRADIUS

**執行以下指令更新系統並安裝 FreeRADIUS**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y freeradius freeradius-utils
```

**確認 FreeRADIUS 是否正常運行**

```bash
sudo systemctl enable freeradius
sudo systemctl start freeradius
sudo systemctl status freeradius
```

## 安裝 PrivacyIDEA

**安裝 PrivacyIDEA**

```bash
sudo add-apt-repository ppa:privacyidea/privacyidea
sudo apt update
sudo apt install -y privacyidea-apache2
```

**重新啟動 Apache 伺服器**

```bash
sudo systemctl restart apache2
```

**測試 PrivacyIDEA Web 介面，於瀏覽器輸入以下網址**

http://<your_server_ip>/privacyidea

**安裝 PrivacyIDEA RADIUS 模組**

```bash
sudo apt install -y privacyidea-radius
```

## 設定 FreeRADIUS 與 PrivacyIDEA

### 啟用 FreeRADIUS REST 模組

**編輯 mods-available/rest 檔案**

```bash
sudo nano /etc/freeradius/3.0/mods-available/rest
```

**在檔案中加入以下內容**

```bash
rest { uri = "http://127.0.0.1/privacyidea/auth" method = "post" body = "json" tls { disable = yes } }
```

**啟用 rest 模組**

```bash
sudo ln -s /etc/freeradius/3.0/mods-available/rest /etc/freeradius/3.0/mods-enabled/
```

### 啟用 RADIUS Challenge

**編輯 sites-enabled/default 檔案**

```bash
sudo nano /etc/freeradius/3.0/sites-enabled/default
```

**在 authorize 區塊中加入**

```bash
authorize { rest if (!control:Auth-Type) { update control { Auth-Type := "rest" } } }
```

**在 authenticate 區塊中加入**

```bash
authenticate { Auth-Type rest { rest } }
```

**在 post-auth 區塊中加入**

```bash
post-auth { if (reply:Module-Failure-Message && &control:Auth-Type == "rest") { update reply { Reply-Message := "Enter OTP" } handled } }
```

## 測試 RADIUS Challenge

### 在 PrivacyIDEA 設定 OTP

登入 PrivacyIDEA Web 介面
前往 Users，新增使用者
前往 Tokens，為該使用者 Enroll Token
選擇 "TOTP"
掃描 QR Code 至 Google Authenticator

## 測試 FreeRADIUS

第一步：輸入密碼

執行以下指令測試密碼驗證：

```bash
echo "User-Name=testuser, User-Password=mypassword" | radclient -x 127.0.0.1 auth testing123
```

預期回應應包含：

Received Access-Challenge
Reply-Message = "Enter OTP"

第二步：輸入 OTP

執行以下指令測試 OTP 驗證：

```bash
echo "User-Name=testuser, Response=123456" | radclient -x 127.0.0.1 auth testing123
```

若 OTP 正確，預期回應應為：

Received Access-Accept
