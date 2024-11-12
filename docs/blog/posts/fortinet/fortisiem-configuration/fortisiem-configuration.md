---
title: FortiSIEM安裝設定
description: 近期因工作需求，需要安裝設定FortiSIEM，故記錄一下整個安裝設定步驟
date: 2024-08-07
comment: true
categories:
    - Fortinet
tags:
    - Fortinet
    - FortiSIEM
comments: true
banner: img.png
draft: true
---

## FortiSIEM Node Types

`Supervisor`

:   The Supervisor node is mandatory in all deployments. It runs the core services and manages the other nodes in the cluster.

`Workers`

:   Worker nodes are optional. They are used in larger deployments to increase log processing and query performance, and to scale the ClickHouse database. There is no hard limit on the number of Worker nodes that can be deployed.

`Collectors`
:   Collector nodes are optional. They are used in small and large deployments to offload log collection and performance monitoring from the Supervisor node, to support distributed remote site log collection, and to collect logs from FortiSIEM Agents. There is no hard limit on the number of Collector nodes that can be deployed.

## FortiSIEM硬體資源需求

![hardware requirements](images/img-11.png)

## ClickHouse Overview

| ClickHouse Node Role | Description                                  | Can run on           |
| -------------------- | -------------------------------------------- | -------------------- |
| ClickHouse Keeper    | Manages ClickHouse insertion and replication | Supervisor or Worker |
| Data Node            | Inserts data into ClickHouse Database        | Supervisor or Worker |
| Query Node           | Reads data from ClickHouse Database          | Supervisor or Worker |

The ClickHouse keeper process is critical. It manages data insertion and replication within the ClickHouse cluster. If the keeper process is not functional, then data cannot be written into the database, event ingestion will stop, and the system will be in a read-only state.

## ClickHose Database Storage Requirement

FortiSIEM event storage requirement depends on the following factors:

Events per second (EPS)

Bytes/event

Compression Ratio

Retention Period

Typically, EPS peaks during morning hours on weekdays and goes down dramatically after 2 pm on weekdays, and also remains low on weekends. So, the average EPS should be used to calculate storage needs.

Bytes/event depends on the rate of event types found in your environment. Unix and Router logs tend to be in the 200-300 Bytes range, Firewall logs (e.g. Fortinet, Palo Alto) tend to be in the 700-1,500 Bytes range, Windows Security logs tend to be a little larger (1,500 – 2,000 Bytes), and Cloud logs tend to be much larger (2,000 Bytes -10K Bytes sometimes).

Fortinet has chosen Zstandard (ZSTD) compression algorithm for ClickHouse event database. The overall compression ratio depends on:

Size of raw events

Number of attributes parsed from a raw event. Parsed attributes add storage overhead, but they are needed for searches to work efficiently. Parsing a raw event during search would slow down searches considerable. FortiSIEM also adds about 20-30 meta data fields such as geo-location including country, city, longitude, latitude for source/destination/reporting IP fields, when such fields are found in events.

Number of string valued attributes in the raw event. String valued attributes typically provide better compression.

It is best for the user to estimate or measure the EPS and Bytes/event for their environment. If you have stored a sufficient mix of events in a file, then you can count Bytes/event as the file size divided by the number of lines in that file.

The compression provided by FortiSIEM varies with event size and number of parsed and stored fields. Compression is higher for larger events of 1,000 Bytes or more and lower for smaller events. For example, a compression ratio of 15:1 is generally seen for logs over 1000 bytes and 25 parsed fields.

The storage requirement can be calculated as follows: EPS * Bytes/event * Compression ratio * Retention period (remember to normalize the units).

Example 1:

The following example illustrates a general storage requirement.

Suppose in your environment that the peak EPS is 10K, and average EPS is 2K. An estimated EPS may be 6K.

Average Raw Bytes/event is 500 Bytes

Compression ratio 10:1

Retention period 2 weeks (14 days) in Hot storage and 2.5 months (76 days) in Warm storage

Replication = 2 (meaning 2 copies of data)

Then

Storage per day: (2 * 5000 * 86400 * 1500) / (10 * 1024 * 1024 * 1024) GB = 120.7GB. The general formula is: Storage per day = (Replication * EPS * Seconds in a day * (Bytes/Event)) / (Compression * 1024 * 1024 * 1024) GB

Hot storage requirement for 14 days

Cluster wide: 676GB

Assuming 1 shard and 2 Data/Query Nodes per shard, per node storage is 338GB

Warm storage requirement for 76 days

Cluster Wide: 3.58TB

Assuming 1 shard and 2 Data/Query Nodes per shard, per node storage is 1.79TB


## 環境說明

- 本次設定使用的版本為7.2.1
- 本次使用虛擬機器版本並安裝於ESXI7.0U3環境
- FortiSIEM DB使用Clickhouse
- 共建立七台VM，一台Supervisor，四台Worker，兩台Collector

| Type       | vCPU | Memory | Disk 2 | Disk 3 | Disk 4 | Disk 5 |
| ---------- | ---- | ------ | ------ | ------ | ------ | ------ |
| Supervisor | 16   | 32     | 100GB  | 60GB   | 60GB   | 60GB   |
| Worker     | 16   | 32     | 100GB  | 1TB    | N/A    |        |
| Collector  | 4    | 8      | 100GB  |        |        |        |

## 安裝FortiSIEM於ESXI

各種不同類型的節點或者All-In-One部署安裝方式均相同，差異點僅在[VM資源](#設定vm資源)及[安裝類型](#設定要安裝的類型)的選擇，以下以安裝Supervisor作為範例

### 匯入OVF範本

#### 至Fortinet網站下載檔案

- 至[Fortinet Support website]( https://support.fortinet.com )下載ESXI版本安裝檔案FSM_FULL_ALL_ESX_7.2.1_Build0241.zip

#### 解壓縮zip檔案

解壓縮下載的FSM_FULL_ALL_ESX_x.x.x_Buildxxxx.zip

![unzip](images/img-1.png)

#### 部署OVF範本

![deploy ovf-1](images/img-2.png)

![deploy ovf-2](images/img-3.png)

![deploy ovf-3](images/img-4.png)

![deploy ovf-4](images/img-5.png)

![deploy ovf-5](images/img-6.png)

![deploy ovf-6](images/img-7.png)

![deploy ovf-7](images/img-8.png)

![deploy ovf-8](images/img-9.png)

![deploy ovf-9](images/img-10.png)

#### 設定VM資源

- 不同的Node Type需依[硬體資源需求表](#fortisiem硬體資源需求)設定所需vCPU、RAM及Local Disk

![edit vm setting-1](images/img-12.png)

![edit vm setting-2](images/img-13.png)

### 安裝FortiSIEM

#### 登入系統

使用Vmware Console登入系統，登入後會強制要求變更密碼

- 帳號：root
- 密碼：ProspectHills

#### 執行設定Script

``` bash linenums="1"
cd /usr/local/bin
./configFSM.sh
```

#### 設定時區

![timezone setting-1](images/img-14.png)

![timezone setting-2](images/img-15.png)

![timezone setting-3](images/img-16.png)

### 設定要安裝的類型

此處依要安裝的節點類型選擇不同選項

![config node type](images/img-17.png)

#### 設定FIPS

![config fips](images/img-18.png)

#### 設定使用的網路介面卡

![config network adapter](images/img-19.png)

#### 設定網路介面卡IP資訊

![config ip-1](images/img-20.png)

![config ip-2](images/img-21.png)

#### 設定主機名稱

![config hostname](images/img-22.png)

#### 網路連接測試

此處的測試目標可以是內部或外部，但要可以被設定的DNS Server解析且可以Ping的通

![connectivity test](images/img-23.png)

## FortiSIEM設定

### Supervisor初始化設定

#### 上傳授權

::: row
    ::: col
        ![upload license](images/img-24.png)
    ::: col
        | 編號 |        欄位名稱         | 欄位描述                 |
        | :--: | :---------------------: | ------------------------ |
        |  1   | **Select license file** | 選擇授權檔案  |
        |  2   |       **User ID**       | 帳號，預設為admin        |
        |  3   |      **Password**       | 密碼，預設為admin*1      |
        |  4   |    **License Type**     | 授權類型，依授權種類選擇 |

#### 設定資料庫

##### 查看Disk路徑

於CLI執行以下指令確認要使用的硬碟編號

```bash linenums="1"
lsblk
```

![alt text](images/img-25.png)

##### 登入完成設定

![alt text](images/img-26.png)

![alt text](images/img-27.png)

![alt text](images/img-28.png)

### Worker註冊

#### 加入節點

![add node-1](images/img-29.png)

![add node-2](images/img-30.png)

| 編號 |     欄位名稱      | 欄位描述                                                                                                     |
| :--: | :---------------: | ------------------------------------------------------------------------------------------------------------ |
|  1   |     **Mode**      | 要加入的節點類型                                                                                             |
|  2   |   **Host Name**   | 要加入的節點名稱                                                                                             |
|  3   |  **IP Address**   | 要加入的節點IP                                                                                               |
|  4   |  **Running On**   | 要加入的節點形式，如VM或實體設備型號                                                                         |
|  5   | **Storage Tiers** | 儲存分層，最多可分三層(Hot、Warm、Cold)，資料存放新到舊為Hot->Warm->Cold，故可以依需求設定不同類型的儲存設備 |
|  6   |   **Disk Path**   | 儲存區路徑，可以至節點使用指令**lsblk**查看                                                                  |

![add node-3](images/img-31.png)

#### 建立ClickHouse拓墣

![clickhouse config](images/img-32.png)

##### 設定ClickHouse Keeper Cluster

!!! Warning
    ClickHouse Keeper操作（例如新增或刪除節點）必須單獨完成，例如新增一個Keeper節點後需先完成測試及部署後才可以再進行下一個節點的新增

![add keeper-1](images/img-33.png)

![add keeper-2](images/img-34.png)

##### 設定ClickHouse Cluster

新增Shard

![alt text](images/img-35.png)
