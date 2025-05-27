---
title: FortiGate HA Active-Passive Cluster設定
description: 本篇教學將說明FortiGate HA Active-Passive Cluster 相關設定。
date: 2025-05-05
categories:
  - Fortinet
tags:
  - FortiGate
  - HA
banner: img.png
comment: true
draft: true
---

<h2>目錄</h2>

- [1. HA 原理與運作架構](#1-ha-原理與運作架構)
    - [1.1. FortiGate Clustering Protocol（FGCP）與同步架構](#11-fortigate-clustering-protocolfgcp與同步架構)
        - [1.1.1. 同步資料內容](#111-同步資料內容)
        - [1.1.2. 傳輸方式與封包型態](#112-傳輸方式與封包型態)
        - [1.1.3. 設定同步及校驗方式](#113-設定同步及校驗方式)
    - [1.2. Active-Passive 模式流量與角色運作](#12-active-passive-模式流量與角色運作)
    - [1.3. VMAC 與 ARP 保留機制](#13-vmac-與-arp-保留機制)
    - [1.4. 角色選舉與 Failover 行為](#14-角色選舉與-failover-行為)
        - [1.4.1. Master / Backup 角色定義與切換機制](#141-master--backup-角色定義與切換機制)
        - [1.4.2. 角色選舉機制](#142-角色選舉機制)
            - [1.4.2.1. override 啟用](#1421-override-啟用)
            - [1.4.2.2. override 停用（預設）](#1422-override-停用預設)
        - [1.4.3. 啟用 override 方式](#143-啟用-override-方式)
- [2. HA 設定流程](#2-ha-設定流程)
    - [2.1. 設定需求與前提條件](#21-設定需求與前提條件)
    - [2.3. 設定方式](#23-設定方式)
    - [2.5. 不會同步的設定項目](#25-不會同步的設定項目)
    - [2.6. 3.6 觀察同步狀態與 Cluster 成員](#26-36-觀察同步狀態與-cluster-成員)
        - [2.6.1. CLI 檢查](#261-cli-檢查)
        - [2.6.2. GUI 查看](#262-gui-查看)
- [3. 管理介面與監控整合](#3-管理介面與監控整合)
    - [3.1. Reserved Management Interface（OOB）](#31-reserved-management-interfaceoob)
        - [3.1.1. CLI 設定範例](#311-cli-設定範例)
        - [3.1.2. 配合每台成員設定該介面 IP（不會同步）](#312-配合每台成員設定該介面-ip不會同步)
        - [3.1.3. 注意事項](#313-注意事項)
        - [3.1.4. GUI 設定位置](#314-gui-設定位置)
    - [3.2. In-band Management（透過 management-ip）](#32-in-band-management透過-management-ip)
        - [3.2.1. CLI 設定](#321-cli-設定)
    - [3.3. ha-direct 的功能與用途](#33-ha-direct-的功能與用途)
        - [3.3.1. CLI 啟用](#331-cli-啟用)
        - [3.3.2. SNMP 範例設定](#332-snmp-範例設定)
    - [3.4. GUI 設定與 SNMP/FortiAnalyzer 整合說明](#34-gui-設定與-snmpfortianalyzer-整合說明)
        - [3.4.1. Reserved IP 顯示位置](#341-reserved-ip-顯示位置)
        - [3.4.2. 日誌 / Trap 流向行為](#342-日誌--trap-流向行為)
    - [3.5. 管理介面選擇建議](#35-管理介面選擇建議)
- [4. 升級](#4-升級)
    - [4.1. Uninterrupted Upgrade（預設）](#41-uninterrupted-upgrade預設)
        - [4.1.1. 流程說明](#411-流程說明)
        - [4.1.2. 特性](#412-特性)
        - [4.1.3. 步驟](#413-步驟)
    - [4.2. Interrupted Upgrade（非預設）](#42-interrupted-upgrade非預設)
        - [4.2.1. 流程說明](#421-流程說明)
        - [4.2.2. 特性](#422-特性)
        - [4.2.3. 步驟](#423-步驟)
- [5. HA 維護操作](#5-ha-維護操作)
    - [5.1. 手動角色切換：Failover 測試與控制](#51-手動角色切換failover-測試與控制)
        - [5.1.1. CLI 觸發角色切換：](#511-cli-觸發角色切換)
        - [5.1.2. GUI 操作（僅 Master 可執行）](#512-gui-操作僅-master-可執行)
    - [5.2. 成員脫離 / 加入 cluster 的處理](#52-成員脫離--加入-cluster-的處理)
        - [5.2.1. 脫離 HA](#521-脫離-ha)
        - [5.2.2. 加入 HA](#522-加入-ha)
    - [5.3. 單機維修、替換設備的安全處理](#53-單機維修替換設備的安全處理)
        - [5.3.1. 建議作法](#531-建議作法)
    - [5.4. 關鍵 CLI 診斷指令](#54-關鍵-cli-診斷指令)
        - [5.4.1. 查看 cluster 狀態](#541-查看-cluster-狀態)
        - [5.4.2. 檢查同步 checksum 差異](#542-檢查同步-checksum-差異)
        - [5.4.3. 顯示 heartbeat 封包統計](#543-顯示-heartbeat-封包統計)
        - [5.4.4. 心跳封包封鎖分析（抓封包）](#544-心跳封包封鎖分析抓封包)

## 1. HA 原理與運作架構

FortiGate 的 High Availability（HA）功能可將多台設備組成 cluster，以實現故障轉移與不中斷的服務。Active-Passive 模式中，僅 Master 裝置處理流量，其餘為備援角色（Backup），以便在發生故障時自動接手。

### 1.1. FortiGate Clustering Protocol（FGCP）與同步架構

FortiGate 使用 **FortiGate Clustering Protocol (FGCP)** 在 HA 成員間進行角色協調與資料同步。

#### 1.1.1. 同步資料內容

Master 會同步以下資料至所有 Backup 成員：

- 設定檔（config）
- Session 表（視 session-pickup 設定而定）
- 裝置健康狀態（如 uptime、daemon 狀態、介面狀態）

這些資訊透過 heartbeat port 傳輸，確保 Backup 能在故障發生時無縫接手。

#### 1.1.2. 傳輸方式與封包型態

HA 使用不同方式進行狀態同步與 session 傳輸，傳輸方式如下：

| 功能類型                | 說明                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Heartbeat**           | 使用 Layer 2 broadcast 封包，EtherType `0x8890`                                         |
| **Session 同步**        | 使用 UDP/708 傳輸，封包封裝為 EtherType `0x8892`（指定介面）或 `0x8893`（預設）         |
| **設定同步 / CLI 控制** | 使用 Telnet over FGCP 封包，EtherType `0x8893`，傳送設定變更與 `execute ha manage` 指令 |

!!! info
    若部署於 VM 或 Cloud 環境，L2 Broadcast 可能被阻擋，建議啟用 `unicast-hb`，改以 Layer 3 傳輸 heartbeat 封包。

#### 1.1.3. 設定同步及校驗方式

**設定變更同步**

當管理者在 Master 上進行設定變更，變更會**立即同步**至所有 Backup 成員

**一致性校驗**

- 系統會每 **60 秒** 檢查 cluster 成員間的設定 checksum
- 若發現 Backup 的 checksum 不一致，改為每 **15 秒** 檢查一次
- 若連續 **5 次 checksum 檢查皆不一致** → 觸發 **Full Sync**，重傳整份設定檔

### 1.2. Active-Passive 模式流量與角色運作

| 角色   | 功能說明                                   |
| ------ | ------------------------------------------ |
| Master | 處理所有進出流量、同步設定、維持會話       |
| Backup | 不處理流量，只收設定與狀態資訊，必要時接手 |

切換條件觸發後（如 master 故障、連線中斷），Backup 成為新的 Master 接手服務。會話是否保留，依 session pickup 設定而定。

### 1.3. VMAC 與 ARP 保留機制

HA 中各介面會套用虛擬 MAC（VMAC），格式為：

```text
00-09-0f-09-xx-xx
```

其中 `xx-xx` 部分由 group-id 編碼。使用 VMAC 的好處：

- 角色切換後 IP-MAC 對應不變，避免 ARP 更新延遲
- 可快速切換而不影響周邊網路裝置

### 1.4. 角色選舉與 Failover 行為

#### 1.4.1. Master / Backup 角色定義與切換機制

| 角色   | 說明                                           |
| ------ | ---------------------------------------------- |
| Master | 唯一處理所有資料流、負責同步其他成員設定與狀態 |
| Backup | 不處理流量，僅同步 Master 資料，待命以備接手   |

當 Master 裝置發生故障或介面中斷（依監控設定），Backup 會啟動角色選舉機制並接手為新的 Master。  
角色轉換後，新的 Master 將處理流量，並繼續向其他成員同步資料。

---

#### 1.4.2. 角色選舉機制

Fortinet HA Cluster 的主機（Master）選舉行為，會依據 `override` 設定方式而有不同邏輯與排序條件：

---

##### 1.4.2.1. override 啟用

- 若 Master 的 `priority` 被手動調低，或其他成員 `priority` 較高，將可能**觸發角色切換**
- 當原 Master 恢復連線，若其 `priority` 較高，會**重新接任 Master**
- 適合需「固定設備擔任 master」的情境

角色選擇順序如下：

1. **Monitored Interface 狀態**
2. **Priority**
3. **HA uptime**
4. **Serial number（序號）**

---

##### 1.4.2.2. override 停用（預設）

- 即使 `priority` 發生變動，也**不會因此觸發角色切換**
- 避免反覆切換角色，提升整體穩定性
- 適合希望維持穩定 master 角色的部署場景

角色選擇順序如下：

1. **Monitored Interface 狀態**
2. **HA uptime**
3. **Priority**
4. **Serial number（序號）**

!!! note
    - **HA uptime** 是設備自上次 HA 事件（如 failover、重啟）以來的運行時間。
    - 當候選設備之間的 HA uptime 差異小於 300 秒（5 分鐘）時，系統將忽略 uptime 比較，改比較 priority。
    - 無論是否啟用 override，**Monitored Interface 狀態皆為首要依據**。

!!! tip
    若要查詢 **各成員的 HA uptime（影響角色選舉）**，請使用下列 CLI 指令：
    ```shell
    diagnose sys ha dump-by group
    ```
    範例輸出：

    **比較欄位為uptime/reset_cnt=6586/0中的uptime**
    ```shell
                HA information.
    group-id=0, group-name='cluster1'
    has_no_aes128_gcm_sha256_member=0

    gmember_nr=2
    'FW1': ha_ip_idx=1, hb_packet_version=6, last_hb_jiffies=6686140, linkfails=24, weight/o=0/0, support_aes128_gcm_sha256=1
            hbdev_nr=2: port23(mac=7478..a4, last_hb_jiffies=6686140, hb_lost=0), port24(mac=7478..a5, last_hb_jiffies=6686140, hb_lost=0), 
    'FW2': ha_ip_idx=0, hb_packet_version=28, last_hb_jiffies=0, linkfails=0, weight/o=0/0, support_aes128_gcm_sha256=1

    vcluster_nr=1
    vcluster-1: start_time=1747108373(2025-05-13 11:52:53), state/o/chg_time=3(standby)/2(work)/1747101788(2025-05-13 10:03:08)
            pingsvr_flip_timeout/expire=3600s/0s
            'FW1': ha_prio/o=0/0, link_failure=0, pingsvr_failure=0, flag=0x00000001, mem_failover=0, uptime/reset_cnt=6586/0
            'FW2': ha_prio/o=1/1, link_failure=0, pingsvr_failure=0, flag=0x00000002, mem_failover=0, uptime/reset_cnt=0/3
    ```

    預設若兩台設備HA uptime 差異小於 300 秒，系統將忽略 uptime 比較，進入下一選擇條件，可使用以下指令修改。
    ```shell
    config system ha
    set ha-uptime-diff-margin <value>
    end 
    ```

    📌 與 `get system performance status` 中的 uptime（系統開機時間）不同，選舉用的是這裡的 **HA uptime**。

#### 1.4.3. 啟用 override 方式

可透過 CLI 開啟 override：

```shell
config system ha
    set override enable
end
```

## 2. HA 設定流程

### 2.1. 設定需求與前提條件

在開始設定 HA 前，請確認以下條件已符合：

| 項目              | 要求                                        |
| ----------------- | ------------------------------------------- |
| 型號              | 所有 HA 成員必須為相同型號                  |
| 韌體版本          | 所有成員需為完全相同版本與 build            |
| VDOM 設定         | 若啟用 VDOM，結構與 VDOM 名稱需一致         |
| HA group-name、ID | 所有成員需設定相同的 group-name 與 group-id |
| HA 密碼           | 需一致，否則無法加入 cluster                |

### 2.3. 設定方式

至`System > HA`設定

| 欄位名稱             | 說明                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| Mode                 | 選擇 Active-Passive                                                  |
| Device Priority      | 數值越高者越優先                                                     |
| Group Name           | 群組名稱，所有設備需相同                                             |
| Group ID             | 用於 VMAC 編碼，所有設備需相同                                       |
| Password             | 群組驗證密碼，所有設備需相同                                         |
| Override             | 啟用後當Monitored Interfaces狀態一致則priority較高者會成為master         |
| Heartbeat Interfaces | 用於同步設定、session及監控對端存活狀態，建議設 2 條以上避免單點失敗 |
| Monitored Interfaces | 設定監控哪些介面，當監控的介面down時將會觸發ha failover              |
| Session Pickup       | 是否同步session，建議`啟用`以降低session中斷情形                     |

當第二台（Backup）設定好相同 group-name、group-id、password 並連上 heartbeat port 後：

- 會與現有 cluster 成員自動建立通訊
- 若通過驗證，會自動加入 cluster
- **其原有設定（除 HA 本身）會被 Master 覆蓋**

!!! warning
    加入 HA 後，備機的設定僅保留：
    - `config system ha`
    - Reserved port 的 IP（如管理用）
    - hostname、priority（不會同步）

---

### 2.5. 不會同步的設定項目

加入 HA 群組後，以下設定「不會同步」：

| 項目              | 說明                                      |
| ----------------- | ----------------------------------------- |
| Hostname          | 每台設備可不同                            |
| Device priority   | 須個別設定                                |
| management-ip     | 僅適用於 in-band 管理，手動設定           |
| reserved port IP  | 每台成員管理介面 IP，須自行設             |
| interface comment | 介面描述不會同步                          |
| FortiToken        | ✅ 唯一會自動從 Master 同步的例外授權項目 |

---

### 2.6. 3.6 觀察同步狀態與 Cluster 成員

#### 2.6.1. CLI 檢查

```shell
get system ha status
```

- 顯示 cluster ID、Master/Backup、priority、sync status

```shell
diagnose sys ha checksum show
```

- 比較 config checksum，確認同步是否成功

#### 2.6.2. GUI 查看

`Dashboard > Status > System Information > HA Status`  
點擊後可查看成員清單、狀態與角色、同步狀況。

## 3. 管理介面與監控整合

在 FortiGate HA 環境中，預設僅 Master 成員處理所有資料流與管理流量（如 SNMP Trap、Syslog、FortiAnalyzer Logs 等）。為了達到個別管理與監控需求，需正確配置 Reserved 或 In-band 管理介面，並啟用 `ha-direct` 功能。

### 3.1. Reserved Management Interface（OOB）

**Reserved Interface** 是在 HA 架構中，每台成員都使用獨立的實體介面與 IP 來進行管理用途，這些介面不參與資料流量。

#### 3.1.1. CLI 設定範例

```shell
config system ha
    set ha-mgmt-status enable
    set ha-direct enable
    config ha-mgmt-interfaces
        edit 1
            set interface "port8"
            set gateway 192.168.100.1
        next
    end
end
```

#### 3.1.2. 配合每台成員設定該介面 IP（不會同步）

```shell
config system interface
edit "port8"
    set ip 192.168.100.11 255.255.255.0
    set allowaccess ping https ssh snmp
next
end
```

#### 3.1.3. 注意事項

- 該 IP 需設定為靜態，不能 DHCP
- gateway 設定會加進 routing table，可能影響資料路由
- 建議排除該介面於 routing 與 policy 中，僅做管理使用

#### 3.1.4. GUI 設定位置

`System > HA` → Enable Reserved Management Interface  
接著於各成員設定各自 IP → `Network > Interfaces > portX`

---

### 3.2. In-band Management（透過 management-ip）

若沒有額外管理 port，也可透過主流量介面指定「僅供管理使用」的 IP。

#### 3.2.1. CLI 設定

```shell
config system ha
    set management-ip 192.168.10.11 255.255.255.0
end
```

- 該 IP 不參與 routing，僅供 GUI/SSH/SNMP 使用
- 各成員需個別設定不同 IP
- 不可透過此 IP 發送 log unless `ha-direct` enabled

---

### 3.3. ha-direct 的功能與用途

預設情況下，只有 Master 裝置能：

- 傳送 SNMP Trap
- 發送 Syslog、FAZ log
- 啟動 FortiCloud、NTP 等服務流量

若要讓 Backup 成員也能發送這些流量，**必須啟用 `ha-direct`** 並搭配 Reserved Interface 或 management-ip。

#### 3.3.1. CLI 啟用

```shell
config system ha
    set ha-direct enable
end
```

#### 3.3.2. SNMP 範例設定

```shell
config system snmp community
edit 1
    set name "monitor"
    config hosts
        edit 1
            set ip 192.168.100.200 255.255.255.255
            set ha-direct enable
        next
    end
next
end
```

!!! warning
    若未設定 `ha-direct enable`，Backup 即使有 IP 也不會啟動 SNMP agent 或傳送 trap。

---

### 3.4. GUI 設定與 SNMP/FortiAnalyzer 整合說明

#### 3.4.1. Reserved IP 顯示位置

- `Dashboard > Status > HA Status` → 每台成員的 reserved IP
- `Network > Interfaces > portX` → 可設定 admin access 與 allowaccess

#### 3.4.2. 日誌 / Trap 流向行為

| 功能             | ha-direct 未啟用（預設） | ha-direct 啟用            |
| ---------------- | ------------------------ | ------------------------- |
| Syslog           | 僅由 Master 傳出         | 各成員可獨立傳送          |
| FortiAnalyzer    | 僅由 Master 傳送         | 各成員可自行上傳 log      |
| SNMP 查詢        | 僅 Master 回應           | 各自裝置可被查詢、發 Trap |
| NTP / FortiCloud | 由 Master 發送           | 各裝置可自行上網同步      |

---

### 3.5. 管理介面選擇建議

| 方式          | 適用情境             | 優點                   | 注意事項                          |
| ------------- | -------------------- | ---------------------- | --------------------------------- |
| Reserved Port | 資源允許 / 實體充足  | 管理流量隔離、安全性高 | 需額外 port、IP、可能影響 routing |
| In-band IP    | Port 有限 / 小型部署 | 無需額外介面，部署快速 | 不參與路由、需搭配 ha-direct 使用 |

!!! tip
    若有 SNMP、FAZ、Syslog 等需求，建議使用 Reserved Interface 並啟用 `ha-direct`，可大幅提升監控可見度。

---

## 4. 升級

在 FortiGate HA 架構中，升級方式若規劃正確，能在不中斷服務的情況下完成。Fortinet 提供兩種升級機制：

- **Uninterrupted Upgrade（不中斷升級）**：預設啟用，讓 cluster 自動分階段升級，盡量不中斷流量
- **Interrupted Upgrade（中斷升級）**：可手動切換模式，所有成員會同時重啟，服務暫停

---

### 4.1. Uninterrupted Upgrade（預設）

#### 4.1.1. 流程說明

FortiGate 的 HA 升級流程會自動處理主從切換與同步，整體過程如下：

1. 使用者透過 GUI 將新 firmware 上傳至目前的 Master 裝置
2. Master 會**先讓所有備機（subordinate）自動升級**
3. 升級完成後，**其中一台備機會自動接任 Master**
4. 原本的 Master 接著升級，升級期間不處理流量
5. 最後，系統會根據 HA 規則再選出一台裝置作為新的 Master，完成整個升級程序

#### 4.1.2. 特性

- TCP 流量可保留不中斷（需啟用 session pickup）
- 升級過程自動切換角色
    - 若 `override` 關閉（預設），原 Master 升級後通常不會再次成為 Master（因 uptime 重置）
    - 若 `override` 啟用且 priority 較高，原 Master 升級後將重新接任 Master，會發生第二次角色切換
- 升級後的成員自動與原設定同步，無需手動比對設定檔

#### 4.1.3. 步驟

1. 登入目前 Master 的 Web GUI
2. 前往 `System > Firmware`
3. 點選右上角 **Upgrade Cluster**
4. 選擇升級來源（FortiGuard、本地檔案等）
5. 系統自動執行 Rolling 升級流程，顯示各成員狀態

### 4.2. Interrupted Upgrade（非預設）

#### 4.2.1. 流程說明

若你不希望 HA cluster 自動升級與切換角色，可改用「中斷升級」模式，過程如下：

1. 使用者手動將 firmware 升級設定為「不保留流量不中斷」
2. 升級會同時發送至所有成員
3. 所有裝置會**同時進行升級與重開機**
4. 開機完成後自動重新建立 HA Cluster，重新選出 Master

!!! warning
    升級期間所有設備皆會同時離線，將**造成流量中斷與服務暫停**。  
    僅適用於可以容忍停機的維護時段。

#### 4.2.2. 特性

- 無升級排序機制，所有成員**同時升級與重啟**
- 不進行主從角色切換
- 升級過程中會中斷所有資料流與連線
- 適用於無需高可用保護的測試/非營運時段

#### 4.2.3. 步驟

1. 登入 CLI，停用不中斷升級模式：
```shell
config system ha
    set uninterruptible-upgrade disable
end
```
2. 上傳 firmware 至 Master 裝置
3. 透過 GUI 執行升級，所有 HA 成員將同步升級與重啟
4. 裝置重啟後，自動重新形成 HA cluster

## 5. HA 維護操作

HA 架構雖可自動偵測並切換，但在實務維護或升級過程中，仍建議使用 CLI 或 GUI 指令進行「手動控制」，以避免非預期切換，或在更換設備時保留 cluster 穩定性。

---

### 5.1. 手動角色切換：Failover 測試與控制

若需驗證 session pickup 或測試新設備能否接手，建議透過 CLI 進行手動切換：

#### 5.1.1. CLI 觸發角色切換：

```shell
diagnose sys ha switch
```

- Backup 會升為 Master，原 Master 成為 Backup
- 實務常用於：
  - 新機測試能否承接 session
  - 升級後功能驗證

#### 5.1.2. GUI 操作（僅 Master 可執行）

`System > HA` → 點選 `Force Switch`  
（僅在某些 FortiOS 版本開放，視 GUI 權限與角色而定）

---

### 5.2. 成員脫離 / 加入 cluster 的處理

#### 5.2.1. 脫離 HA

```shell
config system ha
    set mode standalone
end
```

- 該設備會立即退出 HA 群組，config 將保留現狀（不再受同步影響）
- 適用於升級、檢修、更換設備

#### 5.2.2. 加入 HA

重新設定 HA 參數與主節點相同：

```shell
config system ha
    set mode a-p
    set group-name "cluster1"
    set group-id 1
    set password MyPW
    set priority 100
end
```

- 加入後，Master 會覆蓋該設備的設定（僅保留 hostname、priority、reserved IP 等）

!!! warning
    加入後資料會自動同步，原有設定將被覆蓋（除特定區塊）


### 5.3. 單機維修、替換設備的安全處理

#### 5.3.1. 建議作法

1. 手動切換 Master 至另一台設備（`diagnose sys ha switch`）
2. 待維修設備轉為 Backup 且不處理流量
3. 將其從 cluster 移除
4. 執行維修或替換（Firmware、硬體檢查等）
5. 確認功能正常後，重新設定並加入 HA
6. 視需要再切回原 Master

!!! tip
    建議使用管理 IP 登入維修設備，避免透過 floating IP 發出干擾性封包

### 5.4. 關鍵 CLI 診斷指令

#### 5.4.1. 查看 cluster 狀態

```shell
get system ha status
```

- 顯示角色（Master/Backup）、priority、cluster uptime、sync status

#### 5.4.2. 檢查同步 checksum 差異

```shell
diagnose sys ha checksum show
```

- 若 checksum 不一致，可能需手動同步或排查設定差異

#### 5.4.3. 顯示 heartbeat 封包統計

```shell
diagnose sys ha showhb
```

- 可觀察每個 heartbeat port 的收發狀況

#### 5.4.4. 心跳封包封鎖分析（抓封包）

```shell
diagnose sniffer packet any 'ether proto 0x8890' 4
```

- 若看不到封包，代表心跳被 L2 網路擋住或未通過 VLAN/STP