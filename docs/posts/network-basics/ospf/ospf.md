---
title: Open Shortest Path First（OSPF）開放式最短路徑優先
description: 本篇文章紀錄OSPF概念及相關設定
date: 2025-05-31
comment: true
categories:
    - 網路基礎
tags:
    - 網路基礎
    - OSPF
comments: true
banner: img.png
draft: false
---

<h2>目錄</h2>

- [1. 簡介](#1-簡介)
- [2. OSPF 運作流程](#2-ospf-運作流程)
- [3. 鄰居與鄰接狀態](#3-鄰居與鄰接狀態)
    - [3.1. 建立鄰居關係](#31-建立鄰居關係)
        - [3.1.1. OSPF 網路類型](#311-ospf-網路類型)
        - [3.1.2. Broadcast/Point-to-Point/Point-to-Multipoint](#312-broadcastpoint-to-pointpoint-to-multipoint)
        - [3.1.3. NBMA](#313-nbma)
    - [3.2. 建立鄰接關係](#32-建立鄰接關係)
- [4. OSPF 封包格式與類型](#4-ospf-封包格式與類型)
    - [4.1. 封包格式](#41-封包格式)
    - [4.2. 封包類型](#42-封包類型)
        - [4.2.1. Hello](#421-hello)
        - [4.2.2. Database Description](#422-database-description)
        - [4.2.3. Link-State Request](#423-link-state-request)
        - [4.2.4. Link-State Update](#424-link-state-update)
        - [4.2.5. Link-State Acknowledgment](#425-link-state-acknowledgment)
- [5. LSA類型](#5-lsa類型)
- [6. OSPF區域類型](#6-ospf區域類型)

<div class="page-break"/>

## 1. 簡介

- **OSPF（Open Shortest Path First）** 是一種 **內部閘道協定（IGP, Interior Gateway Protocol）**，屬於 **鏈路狀態路由協定（Link-State Routing Protocol）**，用於在 **單一自治系統（AS, Autonomous System）內**交換路由資訊。
- 它是由 **IETF（Internet Engineering Task Force）** 制定的標準協定，定義於 **RFC 2328（OSPFv2，適用於 IPv4）** 及 **RFC 5340（OSPFv3，適用於 IPv6）**。

## 2. OSPF 運作流程

- **建立鄰居關係**  
  Router 透過 Hello 封包發現鄰居並確認雙向連通（2-Way）。

- **主從關係協商**  
  雙方比較 Router ID 協商出 Master/Slave，準備資料交換。

- **交換資料庫描述（DBD）**  
  交換 Database Description 封包，比對 LSDB 摘要。

- **LSDB 同步（LSR / LSU / LSAck）**  
  針對缺少的 LSA 發送請求並接收回應，完成鏈路狀態同步。

- **計算最短路徑與安裝路由**  
  使用 Dijkstra SPF 演算法計算路由並寫入路由表，完成收斂。

以上流程概述了 OSPF 路由器建立鄰接與路由的整體步驟。

接下來，我們將深入探討這些鄰接過程中所經歷的各種狀態（如 2-Way、Full 等），以及在不同網路環境下的差異與注意事項。

## 3. 鄰居與鄰接狀態

### 3.1. 建立鄰居關係

#### 3.1.1. 網路類型

在 OSPF 運作流程中，封包的傳遞方式與鄰居關係的建立，會受到路由器介面所連接的網路型態影響。  

OSPF 為了能適應各種實體與邏輯網路，將介面分為不同的「網路類型（Network Type）」，每種類型對封包傳送方式、鄰居建立方式、以及是否進行 DR/BDR 選舉等，都有明確定義。

以下是 OSPF 中常見的四種網路類型與其差異：

- **Broadcast：**  
    - 廣播網路係指可以支援Broadcast的網路，如乙太網路、Token Ring、FDDI等。
    - 透過多播封包224.0.0.5自動發現鄰居。
    - 會選舉指定路由器（DR）和備援指定路由器（BDR），非DR/BDR路由器只與DR和BDR建立完全鄰接關係，以減少鄰居數量。
    - DR與BDR使用多播地址224.0.0.5向所有OSPF路由器傳送封包。
    - 其他路由器使用多播地址224.0.0.6向DR和BDR傳送封包。
    - Hello間隔預設10秒，Dead間隔40秒。

- **Non-Broadcast Multi-Access（NBMA）**  
    - 非廣播多路訪問網路係指不支援Broadcast的網路，如ATM、Frame Relay、X.25等。
    - 鄰居需手動設定。
    - 會選舉指定路由器（DR）和備援指定路由器（BDR），非DR/BDR路由器只與DR和BDR建立完全鄰接關係，以減少鄰居數量。
    - 所有OSPF封包均使用單播方式發送。
    - Hello間隔預設30秒，Dead間隔120秒。

- **Point to Point**  
    - 介面直接連接兩台路由器的鏈路，如PPP、HDLC、E1、SONET等。
    - 透過多播封包224.0.0.5自動發現鄰居。
    - 不進行DR/BDR選舉。
    - 使用多播地址224.0.0.5傳送OSPF封包。
    - Hello間隔預設10秒，Dead間隔40秒。

- **Point to MultiPoint**  
    - NBMA網路的一種特殊設定，視為多個點對點鏈路的集合，如非完全網狀的Frame Relay網路、PPPoE連線等。
    - 鄰居需手動設定。
    - 不進行DR/BDR選舉。
    - Hello封包使用多播地址224.0.0.5，其他封包以單播方式發送。
    - Hello間隔預設30秒，Dead間隔120秒。

Table: OSPF 網路類型比較表

| 網路類型         | 是否支援 Broadcast | 鄰居發現 | DR/BDR 選舉 | 封包傳送方式 | Hello/Dead 間隔 (預設) |
|------------------|--------------------|----------|--------------|----------------|-------------------------|
| Broadcast         | ✅ 是              | 自動     | ✅ 是         | Multicast       | 10s / 40s              |
| NBMA              | ❌ 否              | 手動     | ✅ 是         | Unicast         | 30s / 120s             |
| Point-to-Point    | ✅ 是              | 自動     | ❌ 否         | Multicast       | 10s / 40s              |
| Point-to-Multipoint | 部分支援         | 手動     | ❌ 否         | Hello 用 Multicast，其餘 Unicast | 30s / 120s |

#### 3.1.2. Broadcast/Point-to-Point/Point-to-Multipoint

![建立鄰居關係過程（Broadcast/P2P/P2MP）](images/建立鄰居關係過程（Broadcast,P2p,P2MP）.svg)

**Down**  
OSPF 鄰居狀態的起始點。表示尚未收到任何來自對方的 Hello 封包，。路由器會定期透過 multicast（224.0.0.5） 傳送 Hello 封包，主動尋找鄰居。

> 此時狀態就像一個人站在空地上不斷高喊：「有沒有人在？」

**Init**  
表示已從鄰居收到 Hello 封包，但本身的 Router ID 尚未出現在對方的 Hello 封包中。

> 此時狀態就像我聽到對方喊話但對方「還沒注意到我」。雙方處於一種「我知道你，你還不知道我」的狀態，還沒建立雙向信任。

**2-Way**  
雙方互相在對方 Hello 封包中看見彼此的 Router ID，代表 雙向通訊已建立（Bidirectional）。這時路由器會視網路類型決定是否進行DR/BDR的選擇

> 此時狀態像是我看到你，你也看到我，我們現在是正式的鄰居了，準備開始聊天吧。

#### 3.1.3. NBMA

![建立鄰居關係過程（NBMA）](images/建立鄰居關係過程（NBMA）.svg)

**Down**  
NBMA 網段不支援 multicast，因此無法像 Broadcast 網段一樣主動廣播 Hello 封包來發現鄰居。在還沒設定 neighbor、尚未向對方傳送任何 Hello 封包前，路由器會處於 Down 狀態。

> 此時的狀態就像我手裡握著一份空白通訊錄，還不知道該打給誰，也還沒開始建立任何聯繫。

**Attempt**  
當我已經設定 neighbor，並開始以 unicast 向對方發送 Hello 封包，但對方尚未回應時，狀態就會進入 Attempt。這是 NBMA 網段特有的狀態。

> 此時就像我撥通了電話、開始呼叫：「喂，你在嗎？」但那一端仍然靜悄悄，沒人接聽。

**Init**  
表示已從鄰居收到 Hello 封包，但本身的 Router ID 尚未出現在對方的 Hello 封包中。

> 此時狀態就像我聽到對方在說話，但對方還沒注意到我站在門外。我知道你在，你還不知道我在。

**2-Way**  
雙方互相在對方 Hello 封包中看見彼此的 Router ID，代表雙向通訊已建立（Bidirectional）。這時路由器會進行 DR/BDR 的選擇。

> 此時狀態就像我們彼此點頭打招呼：「我看到你了，你也看到我，我們現在正式是鄰居了，可以開始聊天了。」

### 3.2. 建立鄰接關係

![建立鄰接關係過程（Exstart, Exchange）](images/建立鄰接關係過程(Exstart,Exchange).drawio.svg)

**ExStart**  
當兩台路由器達到 2-Way 狀態後，如果需要建立鄰接關係（通常是 P2P 網段或 DR/BDR），便會進入 ExStart 狀態。  
此時雙方開始協商主從角色（Master/Slave）以及 DD 封包的起始序號（Sequence Number）。  
會各自先送出一封 DD（Database Description）封包，I=1、M=1、MS=1，表明這是主從協商的第一封封包，內容不包含 LSA。

- Router ID 較大者會被選為 Master，負責控制交換流程與序號遞增。
- Master 決定用哪個 Seq 開始，Slave 要照單全收並同步 Seq。
- 雙方在這階段不會送 LSA Header，只是互相「比 Router ID + 誰先發封包」決定誰是老大。

> 此時狀態就像兩人面對面說：「好，我們來協商一下誰當隊長，然後你要聽我節奏講話。」

**Exchange**  
主從關係確立後，進入 Exchange 狀態。雙方開始交換 LSDB（Link State Database）中的摘要資訊，也就是 LSA Header 的目錄。  
Master 開始用固定節奏送出一封封又一封的 DD 封包，每封內包含部分 LSA Header。

- Master 每次遞增 Seq，Slave 回應相同 Seq，表示「我收到這一封囉」。
- 這些 Header 可包含 Router-LSA、Network-LSA、Summary-LSA...，但不含 LSA 全文。
- 雙方藉由這些摘要比對自己 LSDB 的差異，為下一步做準備（進入 Loading 要求遺漏項目）。

> 此時狀態就像雙方各自把自己書櫃上的書目清單交換：「我有這些書，你看要不要借？」「我也給你我有的書單，看看有沒有缺的。」

**Loading**  
進入 Loading 狀態表示雙方已經交換完 LSDB 摘要（DD 封包），此時會根據比對結果，發送 LSR（Link State Request） 封包請求缺漏的 LSA。  
收到請求的一方會用 LSU（Link State Update） 封包回傳完整的 LSA，接收方收到後會以 LSAck（Link State Acknowledgment） 進行確認。

> 此時狀態就像是我看完你的書單後說：「你有這幾本我沒有，借我吧」，你一一把書拿來給我，我確認收好每一本：「收到了，謝啦！」

**Full**  
當所有缺失的 LSA 都成功同步完畢後，狀態就會從 Loading 轉為 Full，代表鄰接關係（Adjacency）正式建立完成。  
此時雙方的 LSDB 是一致的，可以進行路由計算（SPF）並安裝路由。

- OSPF 會維持此 Full 狀態，只要沒有觸發變更（如介面斷線、Hello timeout、LSA 更新等）。
- 如果後續有 LSA 更新，會以 LSU / LSAck 流方式進行差異同步，不再重新協商。

> 此時狀態像是：「我們現在手上的書完全一樣了！你我彼此信任，正式成為鄰接夥伴，以後有更新再隨時交換就好。」

## 4. OSPF 封包格式與類型

OSPF協定是運行在IP層之上的，不透過TCP或UDP，會直接以IP Protocol 89封裝。每一個OSPF封包都由OSPF標頭（OSPF header）加上OSPF的資料內容（OSPF payload）所組成。

### 4.1. 封包格式

![OSPF Packet Format](images/OSPF Packet Format.drawio.svg)

- **Version：**  
    設定OSPF版本，2為支援IPV4，3為支援IPV6。
- **Type：**  
    共有5種類型。Hello(1)、DD(2)、LSR(3)、LSU(4)、LSAck(5)。
- **Packet Length：**  
    SPF Header + Message Body 長度。
- **Router ID：**  
    發送此封包的路由器之Router ID。
- **Area ID：**  
    發送此封包的介面所在區域。
- **Checksum：**  
    校驗和，用於校驗使用。
- **Auth Type:**  
    認證類型，共有3種類型。Null(0)、Simple(1)、MD5(2)
- **Authentication**  
    認證內容，依據認證類型而定。

### 4.2. 封包類型

依據OSPF Header中的Type字段設定不同共可區分以下五種類型封包

#### 4.2.1. Hello

![OSPF Hello Packet](images/OSPF Hello Packet.drawio.svg)

- Network Mask（4 bytes）
    - 在 OSPF 建立鄰居關係時，雙方的Netmask Mask 必須相同
    - 適用於 Broadcast、NBMA 網段（非Point-to-Point）
- Hello Interval（2 bytes）
    - 傳送 Hello 封包的時間間隔
- Options（1 bytes）：  
    ![OSPF Hello Packet Options](images/OSPF Hello Packet Options.drawio.svg)
    - **DC-bit（Demand Circuits bit）：**  
     表示本路由器是否支援「需求電路」模式（Demand Circuits）。網路連線是按需啟動（如ISDN、撥接線路），可以減少OSPF封包傳送頻率，降低連線成本。設為1時，代表支援此功能，OSPF會根據需求才傳送Hello或LSA更新。
    - **EA-bit（External Attributes bit）：**  
    這個bit用於標示路由器是否願意接收和轉發External-Attributes-LSAs。這類LSA主要用於OSPF與BGP的互通（如BGP route reflection資訊在OSPF中傳遞）。實務上，EA-bit在OSPFv2主流應用中較少見。
    - **N/P-bit（NSSA/Propagate bit）：**
    設為1時，表示此路由器或區域支援NSSA功能（允許Type-7 LSA在Stub區域內傳遞，並可轉換為Type-5 LSA）。
    - **MC-bit（Multicast bit）：**
    表示路由器支援IP multicast資料包的轉發（即MOSPF協定）。  MOSPF是OSPF的多播擴充版本，現今已較少使用。
    - **E-bit（External routing bit）：**
    設為1時，表示該路由器或區域允許Type-5 LSA（AS-external-LSA）通過，代表此區域不是Stub Area。  設為0時，則為Stub Area，不允許外部路由資訊傳遞。
- Router Priority：
    - 在Broadcast/NBMA網路上選出DR/BDR的依據
    - 值為0代表不參與選舉
- Designated Router：  
    代表此網路上目前選出的DR IP
- Backup Designated Router：  
    代表此網路上目前選出的BDR IP
- Neighbor：  
    列出此Router已知的鄰居Router ID，用來雙向確認鄰居關係建立與否。

#### 4.2.2. Database Description

![[OSPF Database description Packet.drawio.svg]]

1. Interface MTU （2 bytes）
	* 表示此Router的Interface最大MTU
	* 若MTU不匹配，有些設備（如Cisco）會拒絕鄰居建立
2. Options（1 byte）
	* 同Hello Packet Options欄位，用來表示Router的功能支援
3. Flags（1 byte）
	* I（Initial）：設為1表示這是同步開始階段的第一個封包
	* M（More）：設為1表示後續還有更多DBD封包
	* MS（Master/Slave）：設為1表示此Router是Master
4. DD Sequence Number（4 bytes）
	* 用於識別與排序 Database Description 封包
	* 由Master Router 控制遞增，用來驗證正確順序與重傳判斷

#### 4.2.3. Link-State Request

#### 4.2.4. Link-State Update

#### 4.2.5. Link-State Acknowledgment

## 5. LSA類型

**Type 1 Router LSA**
 **Type 2 Network LSA**
  **Type 3 Summary LSA**
  **Type 4 ASBR Summary LSA**
  **Type 5 External LSA**
  **Type 7**

## 6. OSPF區域類型


<div class="page-break"/>

<h2 class="no-print">參考資料</h2>

[def]: #41-封包格式