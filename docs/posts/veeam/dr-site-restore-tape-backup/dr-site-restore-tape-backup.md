---
title: Veeam磁帶異地還原方式
description: 紀錄Veeam磁帶異地還原方式，與本地還原差異在於異地備份主機需要先識別磁帶內容才可以執行還原
date: 2024-11-01
comment: true
categories:
    - Veeam
tags:
    - Veeam
    - Tape
    - DR
comments: true
banner: img.png
draft: false
---

<h2>目錄</h2>

- [1. 環境說明](#1-環境說明)
- [2. 還原步驟](#2-還原步驟)
    - [2.1. 識別磁帶內容](#21-識別磁帶內容)
    - [2.2. 選取要執行還原的主機](#22-選取要執行還原的主機)
    - [2.3. 選擇要還原的時間點](#23-選擇要還原的時間點)
    - [2.4. 選擇還原方式](#24-選擇還原方式)
    - [2.5. 選擇還原位置](#25-選擇還原位置)
    - [2.6. 選擇還原目的地主機](#26-選擇還原目的地主機)
    - [2.7. 選擇還原目的地Resource Pool](#27-選擇還原目的地resource-pool)
    - [2.8. 選擇還原目的地儲存區](#28-選擇還原目的地儲存區)
    - [2.9. 設定還原目的地資料夾及VM名稱](#29-設定還原目的地資料夾及vm名稱)
    - [2.10. 設定還原目的地網路Port Group](#210-設定還原目的地網路port-group)
    - [2.11. 填寫還原目的](#211-填寫還原目的)
    - [2.12. 開始還原](#212-開始還原)
    - [2.13. 還原狀態確認](#213-還原狀態確認)
- [3. 還原結束後如何移除相關匯入資料](#3-還原結束後如何移除相關匯入資料)

<div class="page-break"/>

## 1. 環境說明

- Veeam版本： 12.12.172
- Veeam授權版本： Enterprise Plus

<div class="page-break"/>

## 2. 還原步驟

### 2.1. 識別磁帶內容

需先將磁帶插入磁帶機內並執行Catalog以識別磁帶內容

![Catalog](images/img-1.png)

<div class="page-break"/>

### 2.2. 選取要執行還原的主機

於Backups -> Tape裡面可以看到匯入的Job，展開匯入的Job並選取要還原的VM

![選取要執行還原的主機](images/img-2.png)

![選取要執行還原的主機](images/img-3.png)

<div class="page-break"/>

### 2.3. 選擇要還原的時間點

![選擇要還原的時間點](images/img-4.png)

![選擇要還原的時間點](images/img-5.png)

![選擇要還原的時間點](images/img-6.png)

<div class="page-break"/>

### 2.4. 選擇還原方式

共有兩種還原方式

- Restore directly from tape：資料會直接由磁帶還原至VM DataStore，過程中備份主機會讀取並緩存磁帶內的Metadata，{==每1TB的磁帶資料量約需100Mb緩存空間==}，但因磁帶無法隨機存取故當需要還原多個VM時會較緩慢

![Restore directly from tape（圖片來源：Veeam官網）](images/img-20.png)

- Restore Through Staging Repository：可同時並行還原多個VM但{==需要額外準備儲存空間==}暫時存放從磁帶還原回來的備份檔案

![Restore Through Staging Repository（圖片來源：Veeam官網）](images/img-21.png)

<div class="page-break"/>

此處選擇使用Restore directly from tape方式

![選擇還原方式](images/img-7.png)

<div class="page-break"/>

### 2.5. 選擇還原位置

![選擇還原位置](images/img-8.png)

<div class="page-break"/>

### 2.6. 選擇還原目的地主機

![選擇還原目的地主機](images/img-9.png)

![選擇還原目的地主機](images/img-10.png)

![選擇還原目的地主機](images/img-11.png)

<div class="page-break"/>

### 2.7. 選擇還原目的地Resource Pool

![選擇還原目的地Resource Pool](images/img-12.png)

<div class="page-break"/>

### 2.8. 選擇還原目的地儲存區

![選擇還原目的地儲存區](images/img-13.png)

<div class="page-break"/>

### 2.9. 設定還原目的地資料夾及VM名稱

![設定還原目的地資料夾及VM名稱](images/img-14.png)

<div class="page-break"/>

### 2.10. 設定還原目的地網路Port Group

![設定還原目的地網路Port Group](images/img-15.png)

<div class="page-break"/>

### 2.11. 填寫還原目的

![填寫還原目的](images/img-16.png)

<div class="page-break"/>

### 2.12. 開始還原

![開始還原](images/img-17.png)

<div class="page-break"/>

### 2.13. 還原狀態確認

![還原狀態確認](images/img-18.png)

<div class="page-break"/>

## 3. 還原結束後如何移除相關匯入資料

需先將磁帶從磁帶機移除後選擇Remove from catalog，當移除完後相關的import jobs或import media pools就會消失

![還原結束後如何移除相關匯入資料](images/img-19.png)

<div class="page-break"/>

<h2 class="no-print">參考資料</h2>

- [Restore from Tape](https://helpcenter.veeam.com/docs/backup/vsphere/restore_from_tape.html?ver=120){:target="_blank" class="no-print"}