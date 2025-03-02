---
title: 使用Nutanix Move轉移ESXI VM至AHV
description: Nutanix Move是一款跨虛擬化平台的遷移工具，提供自動化的方式將工作負載從各種來源（例如 VMware ESXi、Microsoft Hyper-V 等）遷移到 Nutanix AHV 或其他雲端環境，本篇主要介紹從ESXI轉移至AHV方式
date: 2025-02-19
comment: true
categories:
    - Nutanix
tags:
    - Nutanix
    - Move
comments: true
banner: img.png
draft: true
---

<h2>目錄</h2>
- [1. 環境說明](#1-環境說明)
- [2. 軟體下載](#2-軟體下載)
- [3. Upload Image](#3-upload-image)
- [4. Create VM](#4-create-vm)
- [5. 設定IP Address](#5-設定ip-address)

## 1. 環境說明

版本：5.5.2

## 2. 軟體下載

至[Nutanix Software Download](https://portal.nutanix.com/page/downloads/list){:target="_blank"}下載

![Download Move](images/img1.png)

![Download Move](images/img-1.png)

## 3. Upload Image

![Upload Image](images/img-2.png)

![Upload Image](images/img-3.png)

![Upload Image](images/img-4.png)

## 4. Create VM

![Create VM](images/img-5.png)

![Create VM](images/img-6.png)

![Create VM](images/img-7.png)

![Create VM](images/img-8.png)

![Create VM](images/img-9.png)

![Create VM](images/img-10.png)

![Create VM](images/img-11.png)

![Create VM](images/img-12.png)

## 5. 設定IP Address

![Launch Console](images/img-13.png)

帳號：nutanix，密碼：nutanix/4u

![Login](images/img-14.png)

![IP Address Setting](images/img-15.png)

![IP Address Setting](images/img-16.png)

## 6. 登入

https://move_ip

![alt text](images/img-17.png)

![alt text](images/img-18.png)

![alt text](images/img-19.png)

![alt text](images/img-20.png)

## 7. Migration流程

## 8. 上傳VDDK Library

![Upload VDDK Library](images/img-25.png)

![Upload VDDK Library](images/img-26.png)

檔案可至[Broadcom Developer Portal](https://developer.broadcom.com/sdks/vmware-virtual-disk-development-kit-vddk/latest){:target="_blank"}下載for Linux版本

![Download VDDK Library File](images/img-27.png)

![Upload VDDK Library](images/img-28.png)

### 8.1. 新增Enviroments

![alt text](images/img-21.png)

![alt text](images/img-22.png)

![alt text](images/img-23.png)

![alt text](images/img-24.png)

## 9. 建立migration plan

![alt text](images/img-29.png)

![alt text](images/img-30.png)

![alt text](images/img-31.png)

![alt text](images/img-32.png)

![alt text](images/img-33.png)

![alt text](images/img-34.png)

![alt text](images/img-35.png)

![alt text](images/img-36.png)

![alt text](images/img-37.png)

![alt text](images/img-38.png)