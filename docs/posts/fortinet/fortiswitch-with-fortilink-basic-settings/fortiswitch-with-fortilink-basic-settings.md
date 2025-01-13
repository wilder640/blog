---
title: FortiSwitch在FortiLink管理模式下的基本設定方式
description: 本篇紀錄FortiSwitch在FortiLink管理模式下的基本設定
date: 2025-01-13
comment: true
categories:
    - Fortinet
tags:
    - Fortinet
    - FortiSwitch
comments: true
banner: img.png
draft: false
---

<h2>目錄</h2>

- [1. 環境說明](#1-環境說明)
- [2. FortiSwitch管理模式](#2-fortiswitch管理模式)
    - [2.1. Standlone](#21-standlone)
    - [2.2. Managed Switch](#22-managed-switch)
    - [2.3. FortiLan Cloud](#23-fortilan-cloud)
- [3. FortiLink管理模式下FortiSwitch上線流程](#3-fortilink管理模式下fortiswitch上線流程)
- [4. FortiLink](#4-fortilink)
    - [4.1. FortiGate Interface啟用FortiLink功能方式](#41-fortigate-interface啟用fortilink功能方式)
    - [4.2. FortiSwitch啟用auto-discovery-fortilink功能方式](#42-fortiswitch啟用auto-discovery-fortilink功能方式)
- [5. 授權FortiSwitch](#5-授權fortiswitch)
- [6. 部署模式](#6-部署模式)
    - [6.1. 單一台FortiSwitch](#61-單一台fortiswitch)
        - [6.1.1. FortiGate FortiLink Type為Physical](#611-fortigate-fortilink-type為physical)
        - [6.1.2. FortiGate FortiLink Type為Aggregate](#612-fortigate-fortilink-type為aggregate)
    - [6.2. 多台FortiSwitch](#62-多台fortiswitch)
    - [6.3. FortiLink Type為hardware或software switch](#63-fortilink-type為hardware或software-switch)
    - [6.4. FortiLink mode over a layer-3 network](#64-fortilink-mode-over-a-layer-3-network)
        - [6.4.1. 在FortiSwitch上的設定](#641-在fortiswitch上的設定)
        - [6.4.2. 在FortiGate上的設定](#642-在fortigate上的設定)
        - [6.4.3. 連接第二台FortiSwitch](#643-連接第二台fortiswitch)
- [7. VLAN設定](#7-vlan設定)
    - [7.1. 新增VLAN](#71-新增vlan)
    - [7.2. 刪除VLAN](#72-刪除vlan)
    - [7.3. 賦予VLAN到FortiSWitch Port](#73-賦予vlan到fortiswitch-port)
- [8. Trunk（Link Aggregation Group）設定](#8-trunklink-aggregation-group設定)
    - [8.1. 新增Trunk](#81-新增trunk)
    - [8.2. 刪除Trunk](#82-刪除trunk)
- [9. FortiSwitch Port設定](#9-fortiswitch-port設定)
    - [9.1. DHCP Snopping](#91-dhcp-snopping)
    - [9.2. STP](#92-stp)
    - [9.3. Loop Guard](#93-loop-guard)
    - [9.4. Edge Port](#94-edge-port)
    - [9.5. STP BPDU Guard](#95-stp-bpdu-guard)
    - [9.6. STP Root Guard](#96-stp-root-guard)
- [10. Quarantines](#10-quarantines)
    - [10.1. 新增需隔離的Mac Address](#101-新增需隔離的mac-address)
    - [10.2. 刪除被隔離的Mac Address](#102-刪除被隔離的mac-address)
    - [10.3. 啟用bounce the switch port](#103-啟用bounce-the-switch-port)
- [11. 設定Security Policy以允許訪問FortiLink Interface](#11-設定security-policy以允許訪問fortilink-interface)
- [12. 設定FortiSwitch可供存取的管理服務](#12-設定fortiswitch可供存取的管理服務)
- [13. 統一變更FortiSwitch密碼](#13-統一變更fortiswitch密碼)
- [14. SNMP設定](#14-snmp設定)
    - [14.1. 全域設定](#141-全域設定)
        - [14.1.1. SNMP System Info設定](#1411-snmp-system-info設定)
        - [14.1.2. SNMP Community設定](#1412-snmp-community設定)
    - [14.2. 針對特定FortiSwitch設定](#142-針對特定fortiswitch設定)
        - [14.2.1. SNMP System Info設定](#1421-snmp-system-info設定)
        - [14.2.2. SNMP Community設定](#1422-snmp-community設定)
- [15. Syslog設定](#15-syslog設定)
    - [15.1. 全域設定](#151-全域設定)
    - [15.2. 針對特定FortiSwitch設定](#152-針對特定fortiswitch設定)
- [16. Port Mirroring](#16-port-mirroring)
- [17. 更換FortiSwitch](#17-更換fortiswitch)
    - [17.1. 更換未使用MCLAG的FortiSwitch](#171-更換未使用mclag的fortiswitch)
- [18. 重新開機](#18-重新開機)
- [19. 升級Firmware](#19-升級firmware)

<div class="page-break"/>

## 1. 環境說明

- 防火牆型號：FortiGate 61F
- 防火牆版本： 7.2.8
- Switch型號：FortiSwitch 124F-POE
- Switch版本：7.2.8

<div class="page-break"/>

## 2. FortiSwitch管理模式

FortiSwitch管理模式可區分為三種，從7.2版開始切換管理模式不會重新開機

### 2.1. Standlone

- 使用FortiSwitch本身的GUI或CLI管理
- 不需要有FortiGate

```markdown
config switch auto-network
    set status disable
end
```

### 2.2. Managed Switch

- 使用FortiGate GUI或CLI管理
- FortiSwitch需連接到FortiLink Interface

```markdown
config switch auto-network
    set status enable
end
```

### 2.3. FortiLan Cloud

- Standlone Switch但是使用FortiLan Cloud管理
- FortiSwitch本身要能夠上網

```markdown
config switch auto-network
    set status disable
end
config switch flan-cloud
    set status enable
end
```

<div class="page-break"/>

## 3. FortiLink管理模式下FortiSwitch上線流程

1. 決定[部署模式](#6-部署模式)
2. 確定或設定FortiGate的[FortiLink](#41-fortigate-interface啟用fortilink功能方式)
3. 確定或設定[FortiSwitch auto-discovery-fortilink](#42-fortiswitch啟用auto-discovery-fortilink功能方式)
4. [授權FortiSwitch](#5-授權fortiswitch)

<div class="page-break"/>

## 4. FortiLink

- FortiLink是一種專屬的管理協議可使FortiGate藉由此協議管理設定FortiSwitch，在多數的FortiGate上會有預設的Aggregation Interface啟用FortiLink功能但也可以自行在Physical Interface、Software Switch、Hardware Switch啟用該功能，端看要採用何種部署方式。
- 在使用FortiLink管理FortiSwitch時，FortiGate角色就是FortiSwitch的控制器，此時的FortiSwitch被稱為managed switch。
- 從FortiSwitch 7.2版開始已經不使用switch-mgmt-mode設定來指定FortiSwitch是standalone或managed模式，取而代之的是config switch auto-network，預設為enable，故當連接到到FortiLink Interface時會自動切換至FortiLink模式且不會重開。
- Fortiswitch IP會經由FortiGate上的FortiLink Interface DHCP Server派發，若要確保IP均不會變動可以設定DHCP保留區來達成。
- 被FortiGate控管的FortiSwitch設定會寫在FortiGate上故只要備份FortiGate設定檔即可。
- {==不要直接在被管理的FortiSwitch上更改設定==}，因為FortiSwitch不會將更改的設定同步到FortiGate故會造成兩邊資訊不一致，且後續也可能會被FortiGate上的設定覆蓋。
- FortiLink Interface預設允許untagged及tagged frames，Native Vlan為4094，此Vlan也是管理使用的vlan。

<div class="page-break"/>

### 4.1. FortiGate Interface啟用FortiLink功能方式

僅能於CLI啟用，啟用完成後該Interface就可以用來連接FortiSwitch

```markdown
# 進入Interface設定模式
FortiGate-61F # config system interface

# 編輯要啟用FortiLink功能介面 
FortiGate-61F (interface) # edit dmz 

# 啟用FortiLink
FortiGate-61F (dmz) # set fortilink enable 

# 結束編輯
FortiGate-61F (dmz) # end
```

啟用完成後可以於GUI查看確認

![FortiLink](images/img-4.png)

<div class="page-break"/>

### 4.2. FortiSwitch啟用auto-discovery-fortilink功能方式

從FortiSwitch 7.2.0版本以後預設所有的Interface都會啟用故不需要額外設定，若是較早期版本則需查看手冊確認哪些介面有啟用，有啟用的Interface才會自動查找FortiLink Interface

```markdown
# 進入Interface設定模式
S124 # config switch interface 

# 編輯要啟用auto-discovery-fortilink功能介面 
S124 (interface) # edit port1 

# 啟用auto-discovery-fortilink
S124 (port1) # set auto-discovery-fortilink enable 

# 結束編輯
S124 (port1) # end

```

<div class="page-break"/>

## 5. 授權FortiSwitch

FortiSwitch連接上FortiGate後需要授權才可以使用

![Manual Authorization](images/img-42.png)

也可以設定FortiLink Interface開啟自動授權FortiSwitch功能

![Automatically authorize devices](images/img-43.png)

<div class="page-break"/>

## 6. 部署模式

FortiSwitch有多種部署方式故於安裝前需先評估要採取哪種方式

### 6.1. 單一台FortiSwitch

可分為使用Physical Port或LAG Port連接兩種設定

![Single FortiGate managing a single FortiSwitch unit](images/img-7.png)

![HA-mode FortiGate units managing a single FortiSwitch unit](images/img-38.png)

<div class="page-break"/>

#### 6.1.1. FortiGate FortiLink Type為Physical

直接將FortiGate與FortiSwitch連接即可，但此種方式較不建議，因為缺少上行鏈路的備援且擴充性也較差

![FortiLink Type Physical](images/img-5.png)

<div class="page-break"/>

#### 6.1.2. FortiGate FortiLink Type為Aggregate

FortiGate與FortiSwitch之間允許多條線路，但若要每條線路都處於Active狀態則要關閉FortiLink split interface功能

![Disable FortiLink Split Interface](images/img-1.png)

下圖為關閉FortiLink split interface後4條線路就都是處於Active狀態，若是沒有關閉則僅會有一條是處於Acitve狀態

![FortiLink Type Aggregate](images/img-2.png)

![FortiLink Type Aggregate](images/img-6.png)

<div class="page-break"/>

### 6.2. 多台FortiSwitch

![Single FortiGate unit managing a stack of several FortiSwitch units](images/img-3.png)

![HA-mode FortiGate units managing a stack of several FortiSwitch units](images/img-39.png)

- FortiSwitch之間以Ring方式連接
- 若FortiLink Type是Aggregate則可以將最後一台FortiSwitch連接到FortiLink Interface但是FortiLink split interface功能要打開，此時最後一台的連線會處於Standby狀態。{==**僅有當第一台FortiSwitch介面Down時該介面才會被使用**==}，使用此方式可以提供上行鏈路的備援，切換會有10-15秒鐘左右的中斷時間

![FortiLink split interface](images/img-9.png)

![Single FortiGate unit managing a stack of several FortiSwitch units](images/img-8.png)

<div class="page-break"/>

### 6.3. FortiLink Type為hardware或software switch

![Single FortiGate unit managing multiple FortiSwitch units](images/img-10.png)

![HA-mode FortiGate units using hardware-switch interfaces and STP](images/img-40.png)

- 因為所有FortiSwitch都是直接連線到FortiGate故FortiSwitch之間的Layer 2流量都需經由FortiGate橋接進而增加FortiGate額外負擔{==故此種模式較不建議使用==}
- 這種模式下FortiGate上的Switch Interface可以接其他設備，但該設備要支援IEEE 802.1q VLAN tagging

![FortiGate FortiLink Type VLAN Switch](images/img-11.png)

![Single FortiGate unit managing multiple FortiSwitch units](images/img-12.png)

<div class="page-break"/>

### 6.4. FortiLink mode over a layer-3 network

- 需先設定FortiSwitch IP及路由確保可以到達FortiGate的FortiLink Interface
- 需先設定FortiGate Policy允許FortiSwitch及FortiGate的FortiLink Interface之間的流量
- 若有Layer 3設定相關需求僅能連線至該FortiSwitch設定無法於FortiGate上設定，包含Vlan Interface及其IP

![FortiLink mode over a layer-3 network](images/img-61.png)

<div class="page-break"/>

#### 6.4.1. 在FortiSwitch上的設定

設定IP Address

![Assign IP Address](images/img-62.png)

![Assign IP Address](images/img-63.png)

新增靜態路由

![Add Static Route](images/img-65.png)

![Add Static Route](images/img-64.png)

設定靜態查找FortiGate FortiLink Interface

```markdown
config switch-controller global
    set ac-discovery-type static
        config ac-list
        edit <id>
        set ipv4-address <IPv4_address>
        next
    end
end
```

![Static Discovery](images/img-67.png)

設定Static ISL

```markdown
config switch trunk
    edit <trunk_name>
        set static-isl enable
        set static-isl-auto-vlan {enable | disable}
        set members <switch_ports>
    next
end
```

此處static-isl-auto-vlan設定為enable故當連接上FortiGate並授權後，其member port的native vlan會被變更為管理vlan 4094並且也會自動建立相關預設vlan

![Add Static ISL](images/img-68.png)

<div class="page-break"/>

#### 6.4.2. 在FortiGate上的設定

可以單獨使用一個physical port當作over layer3 FortiSwitch的FortiLink Interface，這樣在vlan建立時就可以與其他FortiLink區隔開來，這個physical port不一定要有接線，設定方式請參考[FortiGate Interface啟用FortiLink功能](#41-fortigate-interface啟用fortilink功能方式)

![Add FortiLink Interface](images/img-66.png)

新增Policy允許FortiSwitch到FortLink Interface流量，設定方式請參考[設定Security Policy以允許訪問FortiLink Interface](#11-設定security-policy以允許訪問fortilink-interface)

![Add Policy](images/img-69.png)

授權FortiSwitch，設定方式請參考[授權FortiSwitch](#5-授權fortiswitch)

![Authorizing the FortiSwitch unit](images/img-70.png)

<div class="page-break"/>

#### 6.4.3. 連接第二台FortiSwitch

若over layer3的FortiSwitch不止一台則設定步驟與第一台相同僅不需要設定static ISL

- 完成IP及路由設定
- 將第二台FortiSwitch連接第一台FortiSwitch此時就會自動建立ISL Link
- 設定靜態查找FortiGate FortiLink
- 於FortiGate完成授權

![Add Secodary FortiSwitch](images/img-71.png)

<div class="page-break"/>

## 7. VLAN設定

### 7.1. 新增VLAN

![Create VLAN](images/img-13.png)

![Create VLAN](images/img-14.png)

| 編號 |      欄位名稱       | 欄位描述           |
| :--: | :-----------------: | ------------------ |
|  1   | **Interface Name**  | VLAN Interface名稱，可自定義 |
|  2   |     **VLAN ID**     | VLAN ID            |
|  3   | **Addressing mode** | IP設定方式         |
|  4   |   **IP/Netmask**    | IP及子網路遮罩           |

![Create VLAN](images/img-15.png)

| 編號 |         欄位名稱          | 欄位描述                                                |
| :--: | :-----------------------: | ------------------------------------------------------- |
|  1   | **Administrative Access** | Interface允許的功能。若要能夠連線此IP管理FortiGate需要勾選HTTPS |
|  2   |      **DHCP Server**      | 是否要啟用DHCP服務，若啟用則需設定派發範圍等資訊        |

![Create VLAN](images/img-16.png)

| 編號 |         欄位名稱          | 欄位描述                                                |
| :--: | :-----------------------: | ------------------------------------------------------- |
|  1   | **Network** | 網路安全相關功能。如DHCP snooping就是用來防止未授權的DHCP Server  |
|  2   |      **Traffic Shaping**      | 流量管控       |

<div class="page-break"/>

### 7.2. 刪除VLAN

刪除VLAN時若Delete按鈕反灰則代表該介面有相關的關聯設定，需先將相關設定刪除才可以刪除此VLAN，相關設定可以使用Ref欄位查看，最常見的就是未關閉DHCP Server服務

![Delete VLAN](images/img-17.png)

<div class="page-break"/>

### 7.3. 賦予VLAN到FortiSWitch Port

- Native VLAN就是Untagged VLAN，此VLAN Frames傳送出去時不會加Tag其餘VLAN則會;收到Untagged Frames時則會轉發至此VLAN
- Allowed VLAN部分則是允許接收及傳送的VLAN，{==Native VLAN預設為允許傳送及接收故不需要額外加入Allowed VLAN清單裡面==}
- FortiSwitch Port預設接收所有802.1Q Untagged或Tagged Frames，但會再比對Native VLAN及Allowed VLANs清單決定是否放行，若要變更此行為可使用CLI實施更改

```markdown
config switch interface
edit <interface>
set discard-mode <all-tagged | all-untagged | none>
end
```

修改Native VLAN

![Modify Native VLAN](images/img-18.png)

![Modify Native VLAN](images/img-19.png)

![Modify Native VLAN](images/img-20.png)

<div class="page-break"/>

要同時設定多個Interface可以使用shift範圍選取或ctrl特定選取來達到，此處為修改Allowed VLANs

![Ｍodify Multiple Interface](images/img-21.png)

![Ｍodify Multiple Interface](images/img-22.png)

![Ｍodify Multiple Interface](images/img-23.png)

<div class="page-break"/>

若Port是Trunk（Link Aggregation Group）介面的成員則VLAN僅需設定Trunk介面即可

![Modify Trunk Interface](images/img-28.png)

<div class="page-break"/>

## 8. Trunk（Link Aggregation Group）設定

### 8.1. 新增Trunk

![Create Trunk](images/img-24.png)

![New Trunk Group](images/img-25.png)

| 編號 |  欄位名稱  | 欄位描述                                                                                                                                                                                                             |
| :--: | :--------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1   |  **Name**  | Trunk Group名稱                                                                                                                                                                                                      |
|  2   | **MC-LAG** | 僅有在已經設定完成MCLAG Peer Group的交換器才可啟用此選項，啟用後Trunk即可跨兩台在MCLAG Group裡的FortiSwitch                                                                                                          |
|  3   |  **Mode**  | Trunk模式。<br>- **Static：** 不論對端是否有設定Link Aggregation一率啟用。<br> **- Passive LACP：** 僅有接受到對端發送的LACP封包時才會啟用。<br> **- Active LACP：** 主動發送給對端LACP封包協商啟用Link Aggregation |
|  4   | **Trunk Members** | 選擇要加入Link Aggregation的Port                                                                                                                                                                                                                      |

選擇Members

![Select Members](images/img-26.png)

![Apply Settings](images/img-27.png)

<div class="page-break"/>

### 8.2. 刪除Trunk

![Delete Trunk](images/img-29.png)

<div class="page-break"/>

## 9. FortiSwitch Port設定

- STP建議都要啟用
- 若是連接設備則建議可以設定Edge Port、BPDU Guard、DHCP Snopping
- 若是連接第三方交換器則建議可以設定Loop Guard、DHCP Snopping
- 實際設定功能仍需依照實際環境調整

<div class="page-break"/>

### 9.1. DHCP Snopping

- 此功能是用於防止未授權的DHCP Server，需先於VLAN啟用此功能然後再設定哪些Port為Trusted，僅有Trusted Port才會轉發DHCP OFFER及ACK封包，Untrusted Port則會丟棄，故Client就不會收到未授權的DHCP Server回覆
- 預設FortiSwitch上的Port都是Untrsuted，故僅需要針對要變更為Trusted Port部分做設定
- 預設FortiLink Interface為Trusted

啟用DHCP Snooping功能

![Enable DHCP Snooping](images/img-30.png)

![Enable DHCP Snooping](images/img-31.png)

設定Port為Untrusted

![Setting Port DHCP Snooping Untrust](images/img-32.png)

<div class="page-break"/>

### 9.2. STP

Spanning Tree Protocol (STP) 主要用於避免網路迴圈，當兩台交換器之間有多條線路連線時就僅會保持一條線路可轉發。此選項預設啟用。

![Disable STP](images/img-37.png)

<div class="page-break"/>

### 9.3. Loop Guard

- 當STP啟用時如果交換器從多個Port收到同一台交換器的BPDU，則判定兩者之間有多條線路故會block多餘的Port，但在某些情況可能無法阻止迴圈，例如AB兩台交換器彼此之間有兩條線路連接，但B交換器本身發生迴圈因而CPU負載過高造成無法發送BPDU時會讓A交換器認為它跟B之前沒有多條線路連接進而所有的Port都進入轉發狀態使得A交換器也有迴圈情形，
- 為了避免這種情形可以設定Loop Guard。當在計數器到期之前若都未收到BPDU封包則Port會進入 Loop Inconsistent State狀態而不轉發封包。
- 此選項預設停用。
- Edge Port無法設定Loop Guard
- Root Guard及Loop Guard不能同時設定

![Enable Loop Guard](images/img-34.png)

<div class="page-break"/>

### 9.4. Edge Port

- 所謂的Edge Port就是該Port會啟用Portfast功能可以在連接設備後不用經歷Spanning Tree的Listening及Learning直接就是Fordwarding狀態，但是若收到BPDU封包則就會依照正常程序進入Listening及Learning狀態
- 預設所有的FortiSwitch Port都是設定為Edge Port

![Disable Edge Port](images/img-33.png)

<div class="page-break"/>

### 9.5. STP BPDU Guard

- 若Port收到BPDU則會禁止轉發流量。可用於防止接入其他網路設備，但僅限於此網路設備會發送BPDU封包情況下。
- 此選項預設停用。

![Enable STP BPDU Guard](images/img-35.png)

<div class="page-break"/>

### 9.6. STP Root Guard

- 當Port啟用了STP Root Guard並收到優於現有 Root Bridge 的 BPDU 時，該Port會被block，進入 Root Inconsistent 狀態，以防止新接入的設備成為Root Bridge進而造成整體Spanning Tree變動。
- 僅需於可能接入交換器的Port啟用，{==不可於連接既有Root Bridge的Port啟用，會造成所有的Port被block==}。
- 此選項預設停用

![Enable STP Root Guard](images/img-36.png)

<div class="page-break"/>

## 10. Quarantines

此功能可以用於隔離特定的Mac Address，當FortiSwitch Port偵測到被隔離的Mac Address時就會將該Port Vlan改成quarantine vlan

<div class="page-break"/>

### 10.1. 新增需隔離的Mac Address

![Quarantines Mac Address](images/img-50.png)

![Quarantines Mac Address](images/img-51.png)

<div class="page-break"/>

### 10.2. 刪除被隔離的Mac Address

![Delete Quarantines Mac Address](images/img-52.png)

<div class="page-break"/>

### 10.3. 啟用bounce the switch port

當設備被隔離後若是使用DHCP取得IP則在DHCP租約到期或者手動更新前IP都不會變更這會造成所取得的IP網段與當前VLAN不同，當啟用此功能後只要設備被設定隔離或解除隔離時，該設備連接的Port都會disable然後enable，這樣設備就會重新取得當前VLAN IP

```markdown
config switch-controller global
    set bounce-quarantined-link enable
end
```

<div class="page-break"/>

## 11. 設定Security Policy以允許訪問FortiLink Interface

在某些情形下需要能夠從外部訪問FortiSwitch（如需要使用SNMP監控FortiSwitch）這時就需要建立Security Policy，但在GUI上無法在Security Policy中選擇Interface是FortiLink Interface僅能於CLI設定，Policy建立後就可以到GUI修改其他設定

```markdown
config firewall policy
    edit <policy_ID>
        set name <policy_name>
        set srcintf <FortiGate port>
        set dstintf <FortiLink>
        set action accept
        set srcaddr <Source Address>
        set dstaddr <Destination Address>
        set schedule "always"
        set service <Destination Service>
    next
end
```

![Create Policy](images/img-53.png)

<div class="page-break"/>

## 12. 設定FortiSwitch可供存取的管理服務

- FortiGate預設是使用access profile名稱為"default"的設定套用到各台FortiSwitch，故可以直接修該此policy或新建一個policy關聯到要使用的FortiSwitch
- internal-allowaccess指的是使用data port當Fortilink的Fortiswitch
- mgmt-allowaccess指的是使用management port當Fortilink的Fortiswitch，通常是指FortiGate over Layer 3網路管理FortiSwitch且FortiSwitch是使用Management Port與FortiLink溝通情形

新增或修改access profile

```markdown
config switch-controller security-policy local-access
    edit <policy_name>
        set mgmt-allowaccess <options>
        set internal-allowaccess <options>
        next
end
```

![local-access policy](images/img-54.png)

賦予FortiSwitch access profile

```markdown
config switch-controller managed-switch
    edit <FrotiSwitch SN>
        set access-profile <local access policy name>
        next
end
```

![access-profile](images/img-55.png)

<div class="page-break"/>

## 13. 統一變更FortiSwitch密碼

FortiSwitch預設帳號為admin，密碼為無，登入後即可修改密碼但若要所有FortiSwitch都使用相同密碼可於FortiGate設定switch profile

```markdown
config switch-controller switch-profile
    edit "default"

        # 啟用密碼覆蓋功能以讓FortiGate上設定的密碼取代FortiSwitch本機設定的密碼
        set login-passwd-override enable

        # 設定要覆蓋FortiSwitch的密碼
        set login-passwd <new password>
    next
end
```

預設所有FortiSwitch均使用switch profile名稱為"default"的設定檔但也可以針對特定FortiSwitch套用不同設定檔

```markdown

config switch-controller managed-switch
    edit "<FortiSwitch SN>"
    set switch-profile <profile name>
end
```

以上方式僅適用於修改admin帳號，若要建立額外帳號或設定額外帳號密碼僅能利用FortiGate Custom Script功能

<div class="page-break"/>

## 14. SNMP設定

- 需建立[Security Policy](#11-設定security-policy以允許訪問fortilink-interface)以允許SNMP流量到FortiSwitch或FortiSwitch SNMP Trap流量到監控Server
- 需[允許FortiSwitch Interface SNMP管理存取](#12-設定fortiswitch可供存取的管理服務)
- 可選擇使用全域設定或針對特定FortiSwitch單獨設定

### 14.1. 全域設定

#### 14.1.1. SNMP System Info設定

status需設定為enable才會開啟snmp功能

```markdown
config switch-controller snmp-sysinfo
    set status enable
    set description <system_description>
    set contact-info <contact_information>
    set location <FortiGate_location>
end
```

![SNMP System Info](images/img-56.png)

<div class="page-break"/>

#### 14.1.2. SNMP Community設定

status要設定為enable才會啟用此community，hosts為允許的來源IP以及snmp trap要發送的主機，若單純只是要允許任意主機使用snmp監控可以設定為0.0.0.0/0

```markdown
config switch-controller snmp-community
    edit <SNMP_community_entry_identifier>
        set name <SNMP_community_name>
        set status enable
        set query-v1-status enable
        set query-v1-port <0-65535; the default is 161>
        set query-v2c-status enable
        set query-v2c-port <0-65535; the default is 161>
        set trap-v1-status enable
        set trap-v1-lport <0-65535; the default is 162>
        set trap-v1-rport <0-65535; the default is 162>
        set trap-v2c-status enable
        set trap-v2c-lport <0-65535; the default is 162>
        set trap-v2c-rport <0-65535; the default is 162>
        set events {cpu-high mem-low log-full intf-ip ent-conf-change}
        config hosts
            edit <host_entry_ID>
            set ip <IPv4_address_of_the_SNMP_manager>
            end
    next
end
```

![SNMP Community](images/img-57.png)

<div class="page-break"/>

### 14.2. 針對特定FortiSwitch設定

#### 14.2.1. SNMP System Info設定

```markdown
config switch-controller managed-switch
    edit <FortiSwitch_serial_number>
        set override-snmp-sysinfo enable
        config snmp-sysinfo
            set status enable
            set description <system_description>
            set contact-info <contact_information>
            set location <FortiGate_location>
        end
    next
end
```

<div class="page-break"/>

#### 14.2.2. SNMP Community設定

```markdown
config switch-controller managed-switch
    edit <FortiSwitch_serial_number>
        set override-snmp-community enable
        config snmp-community
            edit <SNMP_community_entry_identifier>
            set name <SNMP_community_name>
            set status enable
            set query-v1-status enable
            set query-v1-port <0-65535; the default is 161>
            set query-v2c-status enable
            set query-v2c-port <0-65535; the default is 161>
            set trap-v1-status enable
            set trap-v1-lport <0-65535; the default is 162>
            set trap-v1-rport <0-65535; the default is 162>
            set trap-v2c-status enable
            set trap-v2c-lport <0-65535; the default is 162>
            set trap-v2c-rport <0-65535; the default is 162>
            set events {cpu-high mem-low log-full intf-ip ent-conf-change}
            config hosts
            edit <host_entry_ID>
            set ip <IPv4_address_of_the_SNMP_manager>
            end
        next
    end
```

<div class="page-break"/>

## 15. Syslog設定

- 需建立[Security Policy](#11-設定security-policy以允許訪問fortilink-interface)以允許FortiSwitch Syslog流量到Syslog Server
- 可選擇使用全域設定或針對特定FortiSwitch單獨設定

### 15.1. 全域設定

```markdown
config switch-controller remote-log
    edit {syslogd | syslogd2}
    set status {enable | *disable}
    set server <IPv4_address_of_remote_syslog_server>
    set port <remote_syslog_server_listening_port>
    set severity {emergency | alert | critical | error | warning | notification | *information | debug}
    set csv {enable | *disable}
    set facility {kernel | user | mail | daemon | auth | syslog | lpr | news | uucp | cron | authpriv | ftp | ntp | audit | alert | clock | local0 | local1 | local2 | local3 | local4 | local5 | local6 | *local7}
    next
end
```

<div class="page-break"/>

### 15.2. 針對特定FortiSwitch設定

```markdown
config switch-controller managed-switch
    edit <FortiSwitch_serial_number>
        config remote-log
        edit {edit syslogd | syslogd2}
            set status {enable | *disable}
            set server <IPv4_address_of_remote_syslog_server>
            set port <remote_syslog_server_listening_port>
            set severity {emergency | alert | critical | error | warning | notification | *information | debug}
            set csv {enable | *disable}
            set facility {kernel | user | mail | daemon | auth | syslog | lpr | news | uucp | cron | authpriv | ftp | ntp | audit | alert | clock | local0 | local1 | local2 | local3 | local4 | local5 | local6 | *local7}
            next
        end
    next
end
```

<div class="page-break"/>

## 16. Port Mirroring

```markdown
config switch-controller managed-switch
    edit <FortiSwitch_serial_number>
        config mirror
            edit <mirror_name>

                # 設定此Mirror是否啟用
                set status {active | inactive}

                # 設定流量要複製到哪一個Port。需要先設定才可以設定src部分
                set dst <port_name>

                # 設定目的地Port是否要保留原有交換功能
                set switching-packet {enable | disable}

                # 設定流量從哪些Port進入時需複製
                set src-ingress <port_name>

                # 設定流量從哪些Port出去時需複製
                set src-egress <port_name>
            next
        end
    next
```

![Port Mirroring](images/img-59.png)

<div class="page-break"/>

## 17. 更換FortiSwitch

- 更換的FortiSwitch需要是相同型號
  
### 17.1. 更換未使用MCLAG的FortiSwitch

- 移除故障的FortiSwitch

![Remove the failed FortiSwitch](images/img-44.png)

- 取消故障的FortiSwitch授權

```markdown
    config switch-controller managed-switch
        edit <failed_FortiSwitch_serial_number>
        set fsw-wan1-admin disable
    end
```

![Deauthorize the failed switch](images/img-45.png)

<div class="page-break"/>

- 若要更換的FortiSwitch並非全新設備請先恢復原廠預設值

```markdown
    execute factoryreset
```

![Factory Reset](images/img-46.png)

- 將要更換的FortiSwitch升級到與故障FortiSwitch相同版本

- 執行更換指令

```markdown
    execute replace-device fortiswitch <failed_FortiSwitch_serial_number> <replacement_FortiSwitch_serial_number>
```

![Replace Device Command](images/img-47.png)

<div class="page-break"/>

- 授權更換的交換器

```markdown
    config switch-controller managed-switch
        edit <replacement_FortiSwitch_serial_number>
        set fsw-wan1-admin enable
    end
```

![Authorize the replacement switch](images/img-48.png)

- 連接更換的FortiSwitch

![Connect the replacement switch](images/img-49.png)

<div class="page-break"/>

## 18. 重新開機

![Reboot](images/img-58.png)

<div class="page-break"/>

## 19. 升級Firmware

![Upgrade](images/img-41.png)

![Upgrade](images/img-60.png)

<div class="page-break"/>

<h2 class="no-print">參考資料</h2>

- [FortiLink Guide 7.2.9](https://docs.fortinet.com/document/fortiswitch/7.2.9/fortilink-guide/950458/what-s-new-in-fortios-7-2-9)
