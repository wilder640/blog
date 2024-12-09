---
title: Paloalto防火牆Active-Passive HA設定方式
description: Paloalto High Availability有兩種方式，一種是Active-Active，另一種方式是Active-Passive，這邊主要紀錄Active-Passive設定方式
date: 2024-12-05
comment: true
categories:
    - Paloalto
tags:
    - Paloalto
    - Firewall
    - HA
comments: true
banner: img.png
draft: true
---

<h2>目錄</h2>

- [1. 環境說明](#1-環境說明)
- [2. 連接方式](#2-連接方式)
  
<div class="page-break"/>

## 1. 環境說明

- 防火牆型號：PA-440
- 防火牆版本：

## 2. 連接方式

- 電腦使用網路線連接MGT Port
- 電腦設定為192.168.1.0/24任一個IP，但不要是192.168.1.1
- 使用瀏覽器連線<http://192.168.1.1>
