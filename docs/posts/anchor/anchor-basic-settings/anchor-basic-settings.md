---
title: Anchor 部署及基本設定
description: Aruba Instant On Switch可以使用Instant On Cloud設定或者是Local Web，本篇主要紀錄Local Web方式
date: 2025-10-16
comment: true
categories:
    - Aruba
tags:
    - Aruba
    - Switch
comments: true
banner: img.png
draft: true
---

<h2>目錄</h2>

<div class="page-break"/>

## 部署

**依據官方給予下載連結下載對應壓縮檔解壓縮後可以得到OVA檔案並部署至Vmware環境內**

![alt text](images/img.png)

![alt text](images/img-1.png)

![alt text](images/img-2.png)

![alt text](images/img-3.png)

![alt text](images/img-4.png)

**建議使用完整佈建**

![alt text](images/img-5.png)

![alt text](images/img-6.png)

![alt text](images/img-7.png)

**編輯虛擬機器設定更改 CPU 為8 vCPU 以上，記憶體為 16 GB 以上**

![alt text](images/img-8.png)

![alt text](images/img-9.png)

## 初始化設定

**開機後輸入 Bitlocker密碼：gl0b@lwisdom**

![alt text](images/img-10.png)

**開機完成後輸入登入帳號：anchor_op ， 密碼：P@mP@ssw0rd@nch0r**
![alt text](images/img-11.png)

**登入後設定ANCHOR 系統 IP Address**

![alt text](images/img-12.png)

![alt text](images/img-13.png)

![alt text](images/img-14.png)

!!! info
    此處密碼一樣是輸入anchor_op密碼

![alt text](images/img-15.png)

![alt text](images/img-16.png)

![alt text](images/img-18.png)

**完成IP Address設定後即可使用瀏覽器開啟 https://<ANCHOR_IP\> ，預設帳號：sysadmin ， 密碼：gl0b@lwisdom**

![alt text](images/img-19.png)

**截取此畫面申請授權**

![alt text](images/img-20.png)

**依據收到的授權碼輸入**

![alt text](images/img-21.png)