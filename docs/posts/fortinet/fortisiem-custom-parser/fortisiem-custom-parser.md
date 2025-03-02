---
title: FortiSIEM自定義Parser方式
description: FortiSIEM本身內建許多Parser可以解析不同設備的Log，但若遇到沒有支援的設備就需要自定義Parser才可以將Log解析到各個欄位以利統計分析及搜尋，故本篇主要記錄如何撰寫Parser以及如何套用
date: 2025-01-16
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

<h2>目錄</h2>

- [1. 環境說明](#1-環境說明)
- [2. 介紹](#2-介紹)
    - [2.1. 什麼是Parser](#21-什麼是parser)
    - [2.2. 為何需要Parser](#22-為何需要parser)
    - [2.3. 日誌結構與類型](#23-日誌結構與類型)
        - [2.3.1. 非結構化日誌](#231-非結構化日誌)
        - [2.3.2. 結構化日誌](#232-結構化日誌)
- [3. 正則表達式（Regex）](#3-正則表達式regex)
    - [3.1. 常用meta characters](#31-常用meta-characters)
    - [3.2. 範例](#32-範例)
- [4. Parser架構及注意事項](#4-parser架構及注意事項)
    - [4.1. 架構](#41-架構)
    - [4.2. 注意事項](#42-注意事項)
- [5. Parser Pattern](#5-parser-pattern)
    - [5.1. Global Patterns](#51-global-patterns)
    - [5.2. Local Patterns](#52-local-patterns)
        - [5.2.1. 格式](#521-格式)
        - [5.2.2. 範例](#522-範例)
    - [5.3. 使用方式](#53-使用方式)
- [6. Event Format Recognizer](#6-event-format-recognizer)
- [7. Parsing Instructions](#7-parsing-instructions)
    - [7.1. 資料映射方式](#71-資料映射方式)
    - [7.2. collectAndSet相關函數](#72-collectandset相關函數)
        - [7.2.1. collectFieldsByRegex](#721-collectfieldsbyregex)
        - [7.2.2. collectAndSetByKeyValuePair](#722-collectandsetbykeyvaluepair)
        - [7.2.3. collectAndSetAttrByKeyValuePairMultiValue](#723-collectandsetattrbykeyvaluepairmultivalue)
        - [7.2.4. collectAndSetAttrByPos](#724-collectandsetattrbypos)
        - [7.2.5. collectAndSetAttrByPosWithQuotes](#725-collectandsetattrbyposwithquotes)
        - [7.2.6. collectAndSetAttrByPosWithNestedSep](#726-collectandsetattrbyposwithnestedsep)
        - [7.2.7. collectAndSetAttrByJSON](#727-collectandsetattrbyjson)
        - [7.2.8. collectAndSetAttrFromAnotherEvent](#728-collectandsetattrfromanotherevent)
    - [7.3. setEventAttribute相關函數](#73-seteventattribute相關函數)
        - [7.3.1. setEventAttribute](#731-seteventattribute)
        - [7.3.2. splitJsonEvent](#732-splitjsonevent)
        - [7.3.3. normalizeMAC](#733-normalizemac)
        - [7.3.4. toDateTime](#734-todatetime)
        - [7.3.5. combineMsgId](#735-combinemsgid)
        - [7.3.6. convertStrToIntIpProto](#736-convertstrtointipproto)
        - [7.3.7. convertStrToIntIpPort](#737-convertstrtointipport)
        - [7.3.8. add](#738-add)
        - [7.3.9. divide](#739-divide)
        - [7.3.10. scale](#7310-scale)
        - [7.3.11. replaceStringByRegex](#7311-replacestringbyregex)
    - [7.4. 條件及邏輯函數](#74-條件及邏輯函數)
        - [7.4.1. Switch-Case Constructs](#741-switch-case-constructs)
        - [7.4.2. When-Test](#742-when-test)
        - [7.4.3. Choose](#743-choose)
    - [7.5. 自訂Parser流程](#75-自訂parser流程)

<div class="page-break"/>

## 1. 環境說明

FortiSIEM版本： 7.2.2

<div class="page-break"/>

## 2. 介紹

### 2.1. 什麼是Parser

在 FortiSIEM 中，Parser 負責解析事件並使系統理解接收到的Log。FortiSIEM提供了基於XML的Parser框架，並內建超過200種的Parsers（稱為System Parsers）。若無對應Parser，FortiSIEM雖能存儲數據，但無法解讀內容，因此會將其分類為「unknown event」。

### 2.2. 為何需要Parser

當一個日誌來源有對應的Parser時，FortiSIEM可以理解來自該來源的各種事件，並將關鍵信息提取為屬性。這些屬性至關重要，因為它們可以有效地用於規則、報表、查詢和儀表板。此外，將數據存儲為屬性可以大幅提升查詢的速度和效率。屬性中的數據還能自動與其他使用相同屬性的設備或應用進行交叉關聯，實現更全面的分析。

如果系統不支持某些設備或應用的日誌，您可以創建自訂Parser來教導系統理解這些數據。在FortiSIEM中，自訂 Parser 與系統內建 Parser 使用相同的 XML 邏輯，這使得它們易於創建和修改。同時，您也可以通過編輯或添加 XML 代碼來增強系統或自訂 Parser 的功能，從日誌來源中提取更多信息，從而更好地適應各種日誌解析需求並提供深入的數據洞察。

<div class="page-break"/>

### 2.3. 日誌結構與類型

#### 2.3.1. 非結構化日誌

非結構化日誌沒有固定格式，每條記錄的結構都可能不同。這類日誌的解析較為困難，需要為每條消息單獨定義解析規則。

```plaintext
Jan 16 14:23:45 Server1 CRITICAL: Disk usage at 95%, action required.
Jan 16 14:24:10 Server1 INFO: Backup completed successfully.
Jan 16 14:25:00 Server1 WARNING: High CPU usage detected.
```

<div class="page-break"/>

#### 2.3.2. 結構化日誌

結構化日誌具有預定義的格式，主要包括以下類型：

鍵值對模式（Key-Value Pair）：日誌中的字段以鍵值對形式表示，例如 key1=value1, key2=value2。

```plaintext
date=2025-01-16 time=14:23:45 level=INFO event=UserLogin user=JohnDoe ip=192.168.0.1
date=2025-01-16 time=14:24:00 level=ERROR event=FileUpload status=Failed file="document.pdf"
```

值列表模式（Value List）：字段按固定位置排列，通常以空格或逗號分隔。
例如：

```plaintext
2025-01-16 14:23:45,INFO,UserLogin,JohnDoe,192.168.0.1
2025-01-16 14:24:00,ERROR,FileUpload,document.pdf,Failed
```

FortiSIEM 能使用專門函數處理這些結構化模式，幫助快速解析並提取數據。

<div class="page-break"/>

## 3. 正則表達式（Regex）

- **正則表達式（Regex）** 是由普通字符和 **meta characters** 組成的字符串，用於匹配特定文字、段落等。它在搜索、匹配和數據提取中非常實用。
- 有許多軟體或網站有提供檢視撰寫的Pattern是否可以匹配到需要的內容，如[regex 101](https://www.regex101.com){:target="_blank"}

### 3.1. 常用meta characters

| **meta character** | **功能**                                              | **範例**                                   |
|---------------------|------------------------------------------------------|-------------------------------------------|
| `.`                 | 匹配任意單個字符（不包括換行符）                      | `a.c` 匹配 `"abc"`、`"a1c"`               |
| `\d`                | 匹配一個數字                                         | `\d` 匹配 `0` 至 `9`                      |
| `\w`                | 匹配一個單詞字符（字母、數字或下劃線 `_`）           | `\w+` 匹配 `"word_123"`                   |
| `\s`                | 匹配一個空白字符                                     | `\s+` 匹配多個空格                        |
| `^`                 | 匹配字符串的開頭                                     | `^Error` 匹配 `"Error: File"`             |
| `$`                 | 匹配字符串的結尾                                     | `error$` 匹配 `"File error"`              |
| `*`                 | 匹配前一個字符 0 次或多次                            | `a*` 匹配 `""`、`"a"`、`"aaa"`            |
| `+`                 | 匹配前一個字符 1 次或多次                            | `a+` 匹配 `"a"`、`"aaa"`                  |
| `?`                 | 匹配前一個字符 0 次或 1 次                           | `a?` 匹配 `""` 或 `"a"`                   |
| `{n}`               | 匹配前一個字符剛好 n 次                              | `a{3}` 匹配 `"aaa"`                       |
| `{n,}`              | 匹配前一個字符至少 n 次                              | `a{2,}` 匹配 `"aa"` 或更多                |
| `{n,m}`             | 匹配前一個字符至少 n 次，至多 m 次                   | `a{1,3}` 匹配 `"a"`、`"aa"`、`"aaa"`      |
| `|`                 | 邏輯或，匹配多個模式中的一個                         | `hello|world` 匹配 `"hello"` 或 `"world"` |
| `[]`                | 字符集合，匹配集合中的任意一個字符                   | `[aeiou]` 匹配任意元音字母               |
| `()`                | 分組，用於將多個字符視為一個模式                     | `(abc)+` 匹配 `"abc"` 或 `"abcabc"`       |

<div class="page-break"/>

### 3.2. 範例

```r
# IP 地址匹配
Pattern：\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}
匹配內容："192.168.0.1"

# 日期格式
Pattern：\d{4}-\d{2}-\d{2}
匹配內容："2025-01-16"

# 電子郵件地址
Pattern：\w+@\w+\.\w+
匹配內容："user@example.com"
```

<div class="page-break"/>

## 4. Parser架構及注意事項

### 4.1. 架構

Parser由以下三大區塊組成，後續章節會依序介紹撰寫方式：

- [`<eventFormatRecognizer>`](#6-event-format-recognizer)：用於讓FortiSIEM識別Log該使用哪一個Parser
- [`<patternDefinitions>`](#5-parser-pattern)：用於指定可以重複使用的正則表達式（regex）
- [`<parsingInstructions>`](#7-parsing-instructions)：用於解析Log並將解析出來的資料對應到Event Atttributes

完整架構如下

```xml
<eventFormatRecognizer>....</eventFormatRecognizer>
<patternDefinitions>....</patternDefinitions>
<parsingInstructions>....</parsingInstructions>
```

<div class="page-break"/>

### 4.2. 注意事項

- 因為Parser是使用XML格式撰寫，在 XML 中，`<![CDATA[ ... ]]>`是 CDATA（Character Data） 的標記。它的作用是告訴解析器，標記內的內容是純文字數據，應該原樣處理，而不解析其中的 XML 標籤或特殊字符，故當使用正則表達式時都會將其放置在`<![CDATA[ ... ]]>`中以避免被當成XML標籤或特殊字符解析。
- `<patternDefinitions>`必須在`<parsingInstructions>`之前撰寫

<div class="page-break"/>

## 5. Parser Pattern

在 FortiSIEM 中，Parser pattern用於指定可以重複使用的正則表達式（regex）。這些 pattern 分為 Global Patterns 和 Local Patterns

### 5.1. Global Patterns

- Global Patterns 是可以於所有Parser使用的正則表達式，存儲於 FortiSIEM 的後端中(/opt/phoenix/config/xml/GeneralPatternDefinitions.xml)。這些 pattern 能夠被多個Parser共享，有助於減少重複定義，提高效率。
- {==不要自行修改Global Patterns檔案==}，因為會於系統更新後被覆蓋

```xml
<!-- general pattern definitions -->
<generalPatternDefinitions>

  <!-- event log patterns -->
  <pattern name="gPatSyslogPRI"><![CDATA[<\d+>]]></pattern>
  <pattern name="gPatMesgBody"><![CDATA[.*]]></pattern>
  <pattern name="gPatMesgBodyMin"><![CDATA[.*?]]></pattern>
  <pattern name="gPatSyslogNGHeader"><![CDATA[\w{3}\s+\d{1,2}\s\d{1,2}:\d{1,2}:\d{1,2}\s\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}]]></pattern>


  <!-- time patters -->
  <pattern name="gPatMon"><![CDATA[Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}]]></pattern>
  <pattern name="gPatMonNum"><![CDATA[\d{1,2}]]></pattern>
  <pattern name="gPatDay"><![CDATA[\d{1,2}]]></pattern>
  <pattern name="gPatTime"><![CDATA[\d{1,2}:\d{1,2}:\d{1,2}]]></pattern>
  <pattern name="gPatYear"><![CDATA[\d{2,4}]]></pattern>
  <pattern name="gPatMSec"><![CDATA[\d{1,3}]]></pattern>
  <pattern name="gPatTimeMSec"><![CDATA[\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3}]]></pattern>
  <pattern name="gPatTimeZone"><![CDATA[Z|UTC|GMT|[+-]\d{1,2}:?\d{2}]]></pattern>
  <pattern name="gPatWeekday"><![CDATA[Mon|Tue|Wed|Thu|Fri|Sat|Sun]]></pattern>

  <!-- network patterns, TODO-5.1-ZS: add unit test for 0493681 -->
  <pattern name="gPatIpV4Dot"><![CDATA[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}]]></pattern>
  <pattern name="gPatIpAddr"><![CDATA[[0-9A-Fa-f]{0,4}(?::[0-9A-Fa-f]{0,4}){1,5}:(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9A-Fa-f]{0,4}(?::[0-9A-Fa-f]{0,4})?)|\d{1,3}(?:\.\d{1,3}){3}]]></pattern>
  <pattern name="gPatIpPort"><![CDATA[\d{1,5}]]></pattern>
  <pattern name="gPatProto"><![CDATA[ftp|icmp|tcp|udp|http|ip|smb|smtp|snmp|others|FTP|ICMP|UDP|TCP|HTTP|IP|SMB|SMTP|SNMP|OTHERS]]></pattern>

  <!-- fqdn -->
  <pattern name="gPatFqdn"><![CDATA[\w+[.\w+]+]]></pattern>

  <!-- type patterns -->
  <pattern name="gPatWord"><![CDATA[\w+]]></pattern>
  <pattern name="gPatStr"><![CDATA[[^\s]*]]></pattern>
  <pattern name="gPatHostName"><![CDATA[[\w.-]+]]></pattern>
  <pattern name="gPatStrComma"><![CDATA[[^,]*]]></pattern>
  <pattern name="gPatStrLeftParen"><![CDATA[[^\(]*]]></pattern>
  <pattern name="gPatStrRightSB"><![CDATA[[^\]]*]]></pattern>
  <pattern name="gPatInt"><![CDATA[\d+]]></pattern>
  <pattern name="gPatSpace"><![CDATA[\s+]]></pattern>
  <pattern name="gPatStrEndColon"><![CDATA[[^:]*]]></pattern>
  <pattern name="gPatStrSQ"><![CDATA[[^']*]]></pattern>
  <pattern name="gPatStrDQ"><![CDATA[[^"]*]]></pattern>
  <pattern name="gPatSentence"><![CDATA[\w[\s+\w]*]]></pattern>
</generalPatternDefinitions>

```

<div class="page-break"/>

### 5.2. Local Patterns

- 當沒有匹配的 Global Patterns 時，您可以定義自己的正則表達式作為Local Patterns，但Local Patterns僅能用於該Parser不能被其他Parser使用。
- Local Patterns 必須在`<patternDefinitions>`標籤內定義

#### 5.2.1. 格式

**單行**

```xml
<pattern name="patternName"><![CDATA[regex pattern]]></pattern>

<!-- 
patternName：代表pattern的名稱，可以是任意名稱，但建議以 pat 開頭，後接描述性的名稱，以提高可讀性和組織性。。
regex pattern：代表要使用的正則表達式。
-->
```

**多行**

```xml
<pattern name="patternName" list="begin"><![CDATA[regex pattern]]></pattern>
<pattern name="patternName" list="continue"><![CDATA[regex pattern]]></pattern>
<pattern name="patternName" list="end"><![CDATA[regex pattern]]></pattern>

<!-- 
第一行：必須標記為 list="begin"。
中間行：標記為 list="continue"。
最後一行：標記為 list="end"。
-->
```

<div class="page-break"/>

#### 5.2.2. 範例

**單行**

```xml
<patternDefinitions>
  <pattern name="patUpDown"><![CDATA[Up|Down]]></pattern>
  <pattern name="patEndDollar"><![CDATA[[^$]*]]></pattern>
  <pattern name="patUserCode"><![CDATA[\d{4}:\d{1}]]></pattern>
</patternDefinitions>
```

**多行**

```xml
<patternDefinitions>
  <pattern list="begin" name="patCiscoIOSMod"><![CDATA[SEC|SSH|SEC_LOGIN|SNMP|]]></pattern>
  <pattern list="continue" name="patCiscoIOSMod"><![CDATA[SPANTREE|LINEPROTO|]]></pattern>
  <pattern list="continue" name="patCiscoIOSMod"><![CDATA[CDP|PORT_SECURITY|]]></pattern>
  <pattern list="continue" name="patCiscoIOSMod"><![CDATA[AUTHMGR|MAB|DOT1X|]]></pattern>
  <pattern list="end" name="patCiscoIOSMod"><![CDATA[BGP|BGP_SESSION|OSPF|]]></pattern>
</patternDefinitions>
```

<div class="page-break"/>

### 5.3. 使用方式

使用`<:patternName>`引用已定義的 pattern，以下為範例：

**原始Log**

```plaintext
<123>Dec 14 10:59:56 FW1 Allowed traffic from 192.168.0.1 to 10.0.0.1
```

**僅使用正則表達式匹配**

```regex
<\d+>\s(Jan|Feb|...|Dec)\s\d{1,2}\s\d{1,2}:\d{1,2}:\d{1,2}\s[^ ]*\s.*from\s(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\sto\s(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})
```

**使用Parser Pattern匹配**

```regex
<:gPatSyslogPRI>\s<:gPatMon>\s<:gPatDay>\s<:gPatTime>\s<:gPatStr>\s.*from\s<:gPatIP>\sto\s<:gPatIP>
```

<div class="page-break"/>

## 6. Event Format Recognizer

Event Format Recognizer區段是用於讓FortiSIEM識別Log該使用哪一個Parser，每個Parser僅能定義一個Event Format Recognizer其結構如下：

```xml
<eventFormatRecognizer><![CDATA[regex pattern]]></eventFormatRecognizer>
```

**範例1**

```plaintext
<187>Feb 10 15:00:21 CCServer failed login attempt for Dan from 192.168.0.1
<187>Feb 10 17:12:43 CCServer successful login for Ben from 192.168.10.50
```

這邊可以看到所有的Log都包含『CCServer』故定義Event Format Recognizer時可以使用 CCServer 作為格式識別的關鍵字，定義如下：

```xml
<eventFormatRecognizer><![CDATA[CCServer]]></eventFormatRecognizer>
```

故當Log內包含關鍵字『CCServer』時就會使用此Parser

<div class="page-break"/>

**範例2**

```plaintext
<185>date=2010-04-11 time=20:31:25 devname=APS3012404200944 log_id=0104032002 type=event subtype=admin pri=alert vd=root user="root" ...
<177>date=2013-03-11 time=12:16:18 devname=FortiGate80C logid=0100032002 type=event subtype=system level=alert ...
```

這邊可以看到所有Log都包含『type=字串 subtype=字串』故可以使用這部分作為格式識別的關鍵字，定義如下：

```xml
<eventFormatRecognizer><![CDATA[type=<:gPatStr>\s+subtype=<:gPatStr>]]></eventFormatRecognizer>
```

故當Log內包含『type=字串 subtype=字串』時就會使用此Parser

<div class="page-break"/>

## 7. Parsing Instructions

Parsing Instructions是Parser核心部分，主要用於解析Log並將解析出來的資料對應到Event Atttributes

### 7.1. 資料映射方式

在Parser中，可以通過pattern matching來將Log中的資料映射到變數或屬性，格式如下：

**將資料提取到屬性**

```xml
<attributeName:Pattern>
```

**將資料提取到變數**

```xml
<_variableName:Pattern>
```

**範例**

```xml
<srcIpAddr:gPatIpV4Dot>
<_body:gPatMesgBody>
```

- 變數名稱建議以`_`開頭，如`_myVariable`
- 變數僅在當前Parser有效
- `_rawmsg`為預設變數，用以代表原始Log
- 變數或屬性後方一定是要使用Pattern，可以是Local或Global Pattern，不可以直接使用Regex

<div class="page-break"/>

### 7.2. collectAndSet相關函數

由於資料型態有許多類型故FortiSIEM內建許多函數用以在不同的格式中提取所需資料

#### 7.2.1. collectFieldsByRegex

使用正則表達式解析資料

**語法結構**

```xml
<collectFieldsByRegex src="需解析資料">
    <regex><![CDATA[正則表達式]]></regex>
</collectFieldsByRegex>
```

**範例**

```plaintext
<187>Feb 10 15:00:21 CCServer failed login attempt for Dan from 192.168.0.1
```

```xml
<parsingInstructions>
    <collectFieldsByRegex src="$_rawmsg">
        <regex><![CDATA[<:gPatSyslogPRI><:gPatMon>\s+<:gPatDay>\s+<:gPatTime>\s+<:gPatStr>\s+<_body:gPatMesgBody>]]></regex>
    </collectFieldsByRegex>
</parsingInstructions>
```

結果為_body變數值為CCServer failed login attempt for Dan from 192.168.0.1

<div class="page-break"/>

#### 7.2.2. collectAndSetByKeyValuePair

當Log中的資料是使用key:value方式呈現時可以使用這個function來提取字段

**語法結構1**

```xml

<collectAndSetAttrByKeyValuePair sep="separatorString" src="$inputstr">
    <attrKeyMap attr="_variable1" key="key1"/>
    <attrKeyMap attr="_variable2" key="key2"/>
    ...
</collectAndSetAttrByKeyValuePair>
```

- sep：指定鍵值對之間的分隔符，例如空格、逗號或其他符號。
- src：定義輸入的來源變數，例如 $inputstr 或其他包含原始日誌的變數。
- attrKeyMap：指定目標屬性或變數名稱（如 _variable1 或 attribute1）以及對應的鍵名（如 key1）。

**範例1**

```plaintext
key1=value1 key2=value2 key3=value3
```

```xml
<collectAndSetAttrByKeyValuePair sep=" " src="$inputstr">
    <attrKeyMap attr="_variable1" key="key1"/>
    <attrKeyMap attr="_variable2" key="key2"/>
</collectAndSetAttrByKeyValuePair>
```

- _variable1值為value1
- _variable2值為value2

**語法結構2**

```xml
<collectFieldsByKeyValuePair sep="separatorString" kvsep="KeyVauleseparatorString" src="$inputstr">
    <attrKeyMap attr="_variable1" key="key1"/>
    <attrKeyMap attr="_variable2" key="key2"/>
    ...
</collectFieldsByKeyValuePair>
```

- 若鍵與值間分隔符並非使用`=`則需要新增`kvsep`用於指定鍵和值之間的分隔符（例如 :）。
- sep：鍵值對之間的分隔符。
- kvsep：鍵與值之間的分隔符。
- src：定義輸入的來源變數。
- attrKeyMap：目標屬性或變數名稱以及對應的鍵名。

**範例2**

```plaintext
key1:value1,key2:value2,key3:value3
```

```xml
<collectFieldsByKeyValuePair sep="," kvsep=":" src="$inputstr">
    <attrKeyMap attr="_variable1" key="key1"/>
    <attrKeyMap attr="_variable2" key="key2"/>
</collectFieldsByKeyValuePair>
```

- _variable1值為value1
- _variable2值為value2

<div class="page-break"/>

#### 7.2.3. collectAndSetAttrByKeyValuePairMultiValue

這個函數的目的是從來源輸入中提取字段（key-value 鍵值對），並將所有具有{==相同鍵==}的值合併到一個屬性中，結果以逗號分隔。

**語法結構**

```xml
<collectAndSetAttrByKeyValuePairMultiValue sep="separatorString" src="$inputstr">
    <attrKeyMap attr="variable1 Or Attribute1" key="key1"/>
</collectAndSetAttrByKeyValuePairMultiValue>
```

- sep：鍵值對之間的分隔符。
- src：定義輸入的來源變數。
- attrKeyMap：目標屬性或變數名稱以及對應的鍵名。

**範例**

```plaintext
<181>Jul 15 07:11:31 FWAudit Device=ASA, Version=8.3.1, User=Dave.Roberts, Cmd="config t", Cmd="exit", Cmd="show run", Cmd="reload", sessionID=2
```

```xml
<collectAndSetAttrByKeyValuePairMultiValue sep="=" src="$rawmsg">
    <attrKeyMap attr="command" key="Cmd"/>
</collectAndSetAttrByKeyValuePairMultiValue>
```

結果為command屬性值是config t, exit, show run, reload

<div class="page-break"/>

#### 7.2.4. collectAndSetAttrByPos

`collectAndSetAttrByPos` 是一個用於從輸入字串中依據特定位置提取欄位的函數。此函數的主要用途是從結構化資料中，根據資料中固定位置的值，將它們解析為變數或屬性。

**語法結構**

```xml
<collectAndSetAttrByPos sep="separatorString" src="$inputstr">
    <attrPosMap attr="variableOrAttribute1" pos="offset1"/>
    <attrPosMap attr="variableOrAttribute2" pos="offset2"/>
</collectAndSetAttrByPos>
```

- sep: 指定用來分隔欄位的分隔符號，例如空格或逗號。
- src: 定義資料來源，通常是一個本地變數，例如 $inputstr。
- attrPosMap: 將某個位置的值映射到屬性或變數。
- attr: 定義屬性或變數名稱。
- pos: 指定位置（例如 1 代表第一個欄位，2 代表第二個欄位，以此類推）。

**範例**

```plaintext
ALLOW KP2TG LAN WAN 1.1.1.5 6.6.4.2 TCP 10112 80
```

```xml
<collectAndSetAttrByPos sep=" " src="$inputstr">
    <attrPosMap attr="_logtype" pos="1"/>
    <attrPosMap attr="srcIntfName" pos="3"/>
    <attrPosMap attr="destIntfName" pos="4"/>
    <attrPosMap attr="srcIpAddr" pos="5"/>
</collectAndSetAttrByPos>
```

- _logtype變數值為"ALLOW"
- srcIntfName屬性值為"LAN"
- destIntfName屬性值為"WAN"
- srcIpAddr屬性值為"1.1.1.5"

<div class="page-break"/>

#### 7.2.5. collectAndSetAttrByPosWithQuotes

collectAndSetAttrByPosWithQuotes 函數用於從輸入字符串中提取帶引號的字段，根據字段的位置進行匹配並將結果存儲到指定的變數或屬性中。常用於處理包含多個帶引號字段的日誌數據，特別是以空格或逗號分隔的結構化字符串。

**語法結構**

```xml
<collectAndSetAttrByPosWithQuotes quo="quoteCharacter" sep="separatorString" src="$inputstr">
    <attrPosMap attr="variableOrAttribute1" pos="offset1" />
    <attrPosMap attr="variableOrAttribute2" pos="offset2" />
</collectAndSetAttrByPosWithQuotes>
```

- quo：指定引號類型，通常為單引號 ' 或雙引號 "。
- sep：字段之間的分隔符，通常為空格或逗號。
- src：輸入的字符串來源。
- attrPosMap：定義要提取的屬性名稱及其在字符串中的位置。
    - attr：存儲結果的屬性或變數名稱。
    - pos：字段的順序（從 0 開始）。

**範例**

```plaintext
Event: "User Login", Result: "Success", ID: "12345"
```

```xml
<collectAndSetAttrByPosWithQuotes quo='"' sep=", " src="$_rawMsg">
    <attrPosMap attr="eventType" pos="0" />
    <attrPosMap attr="eventResult" pos="1" />
    <attrPosMap attr="eventID" pos="2" />
</collectAndSetAttrByPosWithQuotes>
```

- eventType屬性值為"User Login"
- eventResult屬性值為"Success"
- eventID屬性值為"12345"

<div class="page-break"/>

#### 7.2.6. collectAndSetAttrByPosWithNestedSep

`collectAndSetAttrByPosWithNestedSep` 函數用於從輸入字符串中提取字段，支持嵌套的分隔符結構，例如使用空格分隔的字段中，某些字段被雙引號或其他包裹符號包圍，但其中包含空格，若沒有使用L2Sep會導致該空格被誤判。

**語法結構**

```xml
<collectAndSetAttrByPosWithNestedSep L1Sep="separatorString1" L2Sep="separatorString2" src="$inputstr">
    <attrPosMap attr="variableOrAttribute1" pos="offset1" />
    <attrPosMap attr="variableOrAttribute2" pos="offset2" />
</collectAndSetAttrByPosWithNestedSep>
```

- L1Sep：第一層分隔符，例如空格 ' ' 或逗號 ','。
- L2Sep：第二層包裹符號，例如 '"'、'[]' 或 '{}'。
- src：輸入字符串來源。
- `<attrPosMap>`：
    - attr：指定存儲結果的屬性名稱。
    - pos：字段的位置索引（從 0 開始）。

**範例**

```plaintext
192.168.0.1 - OBSERVED "Audio/Video Clips" 200
```

```xml
<collectAndSetAttrByPosWithNestedSep L1Sep=" " L2Sep='"' src="$_body">
    <attrPosMap attr="srcIpAddr" pos="1" />
    <attrPosMap attr="bcFilterResult" pos="3" />
    <attrPosMap attr="webCategory" pos="4" />
    <attrPosMap attr="httpStatusCode" pos="5" />
</collectAndSetAttrByPosWithNestedSep>
```

- srcIpAddr屬性值為192.168.0.1
- bcFilterResult屬性值為OBSERVED
- webCategory屬性值為Audio/Video Clips
- httpStatusCode屬性值為200

<div class="page-break"/>

#### 7.2.7. collectAndSetAttrByJSON

collectAndSetAttrByJSON 函數用於從 JSON 格式的日誌中提取指定字段，並將其值存儲到指定屬性中。此函數支持提取簡單字段、嵌套字段和數組內的字段。

**語法結構**

```xml
<collectAndSetAttrByJSON src="$inputJSON">
    <attrKeyMap attr="attributeName1" key="jsonPath1" />
    <attrKeyMap attr="attributeName2" key="jsonPath2" />
</collectAndSetAttrByJSON>
```

- src：指定包含 JSON 日誌數據的變數。
- `<attrKeyMap>`：
    - attr="attributeName"：存儲提取結果的屬性名稱。
    - key="jsonPath"：字段在 JSON 中的路徑。

**範例**

```json
{
    "timestamp": "2015-05-15 12:57:30",
    "duration": 30,
    "connection": {
        "clientIp": "172.27.80.170",
        "clientPort": 9073
    },
    "request": {
        "headers": [
            {"name": "Content-Length", "value": "645"},
            {"name": "User-Agent", "value": "Mozilla/5.0"}
        ]
    },
    "result": "text/html"
}
```

```xml
<collectAndSetAttrByJSON src="$_body">
    <attrKeyMap attr="_time" key="timestamp" />
    <attrKeyMap attr="_duration" key="duration" />
    <attrKeyMap attr="srcIpAddr" key="connection.clientIp" />
    <attrKeyMap attr="srcIpPort" key="connection.clientPort" />
    <attrKeyMap attr="httpContentLen" key="request.headers.find(name='Content-Length', value)" />
    <attrKeyMap attr="httpUserAgent" key="request.headers.find(name='User-Agent', value)" />
</collectAndSetAttrByJSON>
```

- _time變數值為2015-05-15 12:57:30
- _duration變數值為30
- srcIpAddr屬性值為172.27.80.170
- srcIpPort屬性值為9073
- httpContentLen屬性值為645
- httpUserAgent屬性值為Mozilla/5.0

<div class="page-break"/>

#### 7.2.8. collectAndSetAttrFromAnotherEvent

`collectAndSetAttrFromAnotherEvent` 函數用於從其他最近接收的事件中提取字段值，並將其設置到當前事件的屬性中。這種方法適合處理跨事件關聯的情況，例如將某個關鍵屬性從一個事件傳遞到另一個相關事件中。

**語法結構**

```xml
<collectAndSetAttrFromAnotherEvent AnotherEventType="EventType-X">
    <when test="$Attribute = $AnotherEvent.Attribute">
        <setEventAttribute attr="variableOrAttribute1">
            $AnotherEvent.variableOrAttribute1
        </setEventAttribute>
        <setEventAttribute attr="variableOrAttribute2">
            $AnotherEvent.variableOrAttribute2
        </setEventAttribute>
    </when>
</collectAndSetAttrFromAnotherEvent>
```

- AnotherEventType：指定關聯的另一個事件的類型。
- `<when test="condition">`：設置條件，只有當條件滿足時，才會執行對應的字段提取與設置操作。
- $Attribute：當前事件中的屬性。
- $AnotherEvent.Attribute：其他事件中的屬性。
- `<setEventAttribute>`：設置屬性值。

**範例**

Windows Event ID 4624

```plaintext
Log Name:      Security
Source:        Microsoft-Windows-Security-Auditing
Date:          2025-01-20 10:00:00
Event ID:      4624
Task Category: Logon
Level:         Information
Keywords:      Audit Success
User:          N/A
Computer:      WIN2K8.aolabs.com
Description:
An account was successfully logged on.

Subject:
    Security ID:        S-1-5-18
    Account Name:       WIN2K8$
    Account Domain:     AOLABS
    Logon ID:           0x16978b

Logon Information:
    Logon Type:         10
    Restricted Admin Mode: -
    Virtual Account:    No
    Elevated Token:     Yes

Impersonation Level:    Impersonation

New Logon:
    Security ID:        S-1-5-21-2985776519-2486650108-5587231011-1107
    Account Name:       Chris.Durkin
    Account Domain:     AOLABS
    Logon ID:           0x16978b
    Linked Logon ID:    0x0
    Network Account Name:    -
    Network Account Domain:  -
    
Process Information:
    Process ID:         0x9a8
    Process Name:       C:\Windows\System32\winlogon.exe

Network Information:
    Workstation Name:   WIN2K8
    Source Network Address: 192.168.69.180
    Source Port:        51312

Detailed Authentication Information:
    Logon Process:      User32
    Authentication Package: Negotiate
    Transited Services: -
    Package Name (NTLM only): -
    Key Length:         128
```

Windows Event ID 4627

```plaintext
Log Name:      Security
Source:        Microsoft-Windows-Security-Auditing
Date:          2025-01-20 10:05:00
Event ID:      4727
Task Category: Security Group Management
Level:         Information
Keywords:      Audit Success
User:          N/A
Computer:      WIN2K8.aolabs.com
Description:
A security-enabled global group was created.

Subject:
    Security ID:        S-1-5-21-2985776519-2486650108-5587231011-1107
    Account Name:       Chris.Durkin
    Account Domain:     AOLABS
    Logon ID:           0x16978b

New Group:
    Security ID:        S-1-5-21-2985776519-2486650108-5587231011-1207
    Group Name:         ParserGroup
    Group Domain:       AOLABS

Additional Information:
    Privileges:         -
```

上述兩個事件的Logon ID是相同的代表是同一個登入事件，但4624有`Source Network Address`但4627沒有，故可以使用`collectAndSetAttrFromAnotherEvent`來增加

```xml
<collectAndSetAttrFromAnotherEvent AnotherEventType="Microsoft-Windows-Security-Auditing-4624">
    <when test="exist winLogonId">
        <when test="$winLogonId = $AnotherEvent.winLogonId">
            <setEventAttribute attr="srcIpAddr">
                $AnotherEvent.SourceNetworkAddress
            </setEventAttribute>
        </when>
    </when>
</collectAndSetAttrFromAnotherEvent>
```

此時4627事件中會新增`srcIpAddr`屬性且數值等於4624事件中的`SourceNetworkAddress`

<div class="page-break"/>

### 7.3. setEventAttribute相關函數

這裡的函數大多與資料轉換有關，例如合併多個數值、日期格式轉換等

#### 7.3.1. setEventAttribute

setEventAttribute 函數允許將值（用戶自定義值、變數值或屬性值）映射到事件屬性中，以便後續使用。

**直接賦予屬性值**

```xml
<setEventAttribute attr="eventType">CC-Login-Failure</setEventAttribute>
```

**將變數值映射到屬性**

```xml
<setEventAttribute attr="user">$_myvariable</setEventAttribute>
```

**將屬性值映射到另一個屬性值**

```xml
<setEventAttribute attr="user">$targetUser</setEventAttribute>
```

<div class="page-break"/>

#### 7.3.2. splitJsonEvent

- `splitJsonEvent` 函數用於將包含多個事件的 JSON 數組拆分為多條獨立的日誌事件。
- 每個數組中的對象都將被生成為一條新的日誌，此時就可以在同一個Parser處理或是另外建立一個Parser處理新生成的日誌。

**語法結構**

```xml
<setEventAttribute attr="attributeName">
    splitJsonEvent($_json, "arrayKeyPath", "header", "trailer", "dropOriginal")
</setEventAttribute>
```

- $_json：包含 JSON 數據的變量，通常為日誌中的一部分。
- "arrayKeyPath"：JSON 結構中包含數組的鍵名稱，若數組為 JSON 根層則填 ""。
- "header"：每個新日誌的前綴字串（可選，通常標明日誌來源）。
- "trailer"：每個新日誌的後綴字串（可選，通常為空字符串 ""）。
- "dropOriginal"：布林值（字符串 "true" 或 "false"），表示是否丟棄原始 JSON 日誌。

**範例**

```json
{
    "source": "Firewall",
    "events": [
        {"ip": "192.168.1.1", "action": "allow", "timestamp": "2025-01-01T10:00:00Z"},
        {"ip": "10.0.0.2", "action": "deny", "timestamp": "2025-01-01T10:01:00Z"}
    ]
}
```

```xml
<setEventAttribute attr="$_processedEvents">
    splitJsonEvent($_rawmsg, "events", "FirewallEvent:", "", "true")
</setEventAttribute>
```

- `attr="$_processedEvents"`：定義要儲存的屬性或變數名稱。這裡的`$_processedEvents`是存儲拆分結果的變數名稱。
- `$_rawmsg`：指定要處理的原始 JSON 數據。
- `"events"`：指定JSON中哪一個數組鍵名內的資料要被處理。
- `"FirewallEvent"`：為每條新生成的日誌添加前綴。
- `""`：為每條新日誌添加後綴，這裡沒有指定後綴，意味著不會在日誌結尾添加額外信息。
- `"true"`：指示是否丟棄原始日誌。

處理後會變成兩條資料被儲存

```json
FirewallEvent: {"ip": "192.168.1.1", "action": "allow", "timestamp": "2025-01-01T10:00:00Z"}
```

```json
FirewallEvent: {"ip": "10.0.0.2", "action": "deny", "timestamp": "2025-01-01T10:01:00Z"}
```

<div class="page-break"/>

#### 7.3.3. normalizeMAC

normalizeMAC 函數用於將 MAC 地址標準化為統一格式，去除分隔符號（例如冒號 : 或連字符 -），方便進一步處理或比較。

**語法結構**

```xml
<setEventAttribute attr="attributeName">
    normalizeMAC($macAddress)
</setEventAttribute>
```

- `attr="attributeName"`：指定要儲存結果的屬性名稱。
- `$macAddress`：包含原始 MAC 地址的變數。

**範例**

```plaintext
<190> Jan 20 10:00:00 Switch01 MAC=00:1A:2B:3C:4D:5E PORT=GigabitEthernet0/1
```

```xml
<setEventAttribute attr="deviceMac">
    normalizeMAC($_deviceMac)
</setEventAttribute>
```

結果為：normalizedMac = "001A2B3C4D5E"

<div class="page-break"/>

#### 7.3.4. toDateTime

- 所有Log都會被FortiSIEM加上Event Receive Time欄位，表示日誌被 FortiSIEM 接收到的時間，此時間是不可修改的
- 由於各設備表達時間的方式均不相同，故為了可以都映射到相同欄位且可以被統計分析就需要toDateTime Function來標準化表示方式
- year變數一定要在day變數後面不然toDateTime() function會無法正確運作

**語法結構**

```xml
<setEventAttribute attr="deviceTime">
    toDateTime($_mon, $_day, $_year, $time, $_tz)
</setEventAttribute>
```

**範例**

```panintext
<187>Feb 10 15:00:21 CCServer failed login attempt for Dan from 192.168.0.1
```

```xml
<eventFormatRecognizer>
    <![CDATA[CCServer]]>
</eventFormatRecognizer>

<parsingInstructions>
    <collectFieldsByRegex src="$_rawmsg">
        <regex>
            <![CDATA[<:gPatSyslogPRI><_mon:gPatMon>\s+<_day:gPatDay>\s+<_time:gPatTime>\s+<:gPatStr>\s+<_body:gPatMesgBody>]]>
        </regex>
    </collectFieldsByRegex>

    <setEventAttribute attr="deviceTime">
        toDateTime($_mon, $_day, $_time)
    </setEventAttribute>
</parsingInstructions>
```

<div class="page-break"/>

#### 7.3.5. combineMsgId

- `combineMsgId` 函數用於將多個對象（字符串、屬性、局部變量）結合起來，並將其存儲到指定的屬性中。
- 字符串需要用雙引號括起來，屬性和變量則需要用 $ 符號作前綴（如 $attribute, $_variable）。

**語法結構**

```xml
<setEventAttribute attr="attributeName">
    combineMsgId("string1", $attributeOrVariable, "string2", ...)
</setEventAttribute>
```

**範例**

```xml
<!--將字串 "Win-"、變數 $_logType2、字串 "-" 和變數 $_id 的值組合-->
<setEventAttribute attr="eventType">
    combineMsgId("Win-", $_logType2, "-", $_id)
</setEventAttribute>
```

<div class="page-break"/>

#### 7.3.6. convertStrToIntIpProto

FortiSIEM內建屬性`ipProto`預設數值型態為UINT16（無符號16位整數），但若接收的Log是以字串格式呈現，就需要使用`convertStrToIntIpProto`將其轉換成對應整數值

**範例**

```plaintext
PROTO=TCP SPT="443" DPT="80"
```

```xml
<collectAndSetAttrByKeyValuePair sep=" " src="$_rawmsg">
    <attrKeyMap attr="_proto" key="PROTO="/>
    <attrKeyMap attr="_dport" key="DPT="/>
</collectAndSetAttrByKeyValuePair>

<setEventAttribute attr="ipProto">convertStrToIntIpProto($_proto)</setEventAttribute>
<setEventAttribute attr="destIpPort">convertStrToIntIpPort($_dport)</setEventAttribute>
```

<div class="page-break"/>

#### 7.3.7. convertStrToIntIpPort

FortiSIEM內建屬性`srcIpPort`及`destIpPort`預設數值型態為UINT16（無符號16位整數），但若接收的Log是以字串格式呈現，就需要使用`convertStrToIntIpPort`將其轉換成對應整數值

**範例**

```plaintext
PROTO=TCP SPT="443" DPT="80"
```

```xml
<collectAndSetAttrByKeyValuePair sep=" " src="$_rawmsg">
    <attrKeyMap attr="_proto" key="PROTO="/>
    <attrKeyMap attr="_dport" key="DPT="/>
</collectAndSetAttrByKeyValuePair>

<setEventAttribute attr="ipProto">convertStrToIntIpProto($_proto)</setEventAttribute>
<setEventAttribute attr="destIpPort">convertStrToIntIpPort($_dport)</setEventAttribute>
```

<div class="page-break"/>

#### 7.3.8. add

`add` 函數用於將兩個屬性或變數的數值相加，並將結果存儲在指定的屬性中。此函數常用於處理日誌中分別記錄的數據（如傳送與接收的字節數），以計算總量或合併值。

**語法結構**

```xml
<setEventAttribute attr="final_variableOrAttribute">
    add($variableOrAttribute1, $variableOrAttribute2)
</setEventAttribute>
```

- attr="final_variableOrAttribute"：指定要儲存結果的屬性名稱。
- $variableOrAttribute1：第一個變數或屬性，作為加法的第一個操作數。
- $variableOrAttribute2：第二個變數或屬性，作為加法的第二個操作數。

**範例**

```plaintext
Allowed Connection LondonGateway sent=1001,received=4531
```

```xml
<setEventAttribute attr="totBytes">
    add($sentBytes, $recvBytes)
</setEventAttribute>
```

結果：totBytes = 5532

<div class="page-break"/>

#### 7.3.9. divide

`divide` 函數用於執行兩個屬性或變數的除法運算，並將結果存儲在指定的屬性中。此函數常用於計算比例，例如內存使用率、帶寬利用率等。

**語法結構**

```xml
<setEventAttribute attr="final_variableOrAttribute">
    divide($variableOrAttribute1, $variableOrAttribute2)
</setEventAttribute>
```

- attr="final_variableOrAttribute"：指定要儲存結果的屬性名稱。
- $variableOrAttribute1：分子（被除數）的變數或屬性。
- $variableOrAttribute2：分母（除數）的變數或屬性。

```plaintext
Device X Memory: TOTAL MEM="30000", USED MEM="10000"
```

```xml
<setEventAttribute attr="memUtil">
    divide($_usedMem, $_totalMem)
</setEventAttribute>
```

結果為memUtil = 0.3333

<div class="page-break"/>

#### 7.3.10. scale

scale 函數用於執行數值的比例換算，例如將秒數轉換為毫秒，或者進行其他單位換算。這在處理數據時特別有用，當目標屬性需要特定的數值單位時（例如毫秒而不是秒）。

**語法結構**

```xml
<setEventAttribute attr="final_variableOrAttribute">
    scale($variableOrAttribute, value)
</setEventAttribute>
```

- `attr="final_variableOrAttribute"`：指定要儲存換算結果的屬性名稱。
- `$variableOrAttribute`：原始數值所在的變數或屬性。
- `value`：比例因子，用於將原始數值乘以該值以進行換算。

```plaintext
Process completed in durationSec="120"
```

```xml
<setEventAttribute attr="durationMSec">
    scale($_durationSec, 1000)
</setEventAttribute>
```

結果為durationMSec = 120000

<div class="page-break"/>

#### 7.3.11. replaceStringByRegex

replaceStringByRegex 函數用於使用正則表達式替換屬性或變數中的字符串。這在需要清理、格式化或轉換提取的字符串時非常有用。

**語法結構**

```xml
<setEventAttribute attr="final_variableOrAttribute">
    replaceStringByRegex($variableOrAttribute, "regex", "string")
</setEventAttribute>
```

- attr="final_variableOrAttribute"：指定要存儲結果的屬性名稱。
- $variableOrAttribute：原始字符串所在的變數或屬性。
- "regex"：要匹配的正則表達式。
- "string"：匹配後的替換內容。

**範例**

```plaintext
Attack: IPS Signature:"Malware Attack", ID: "67231"
```

```xml
<setEventAttribute attr="eventType">
    replaceStringByRegex($_eventType, "\\s+", "_")
</setEventAttribute>
```

結果為eventType = "Malware_Attack"

<div class="page-break"/>

### 7.4. 條件及邏輯函數

#### 7.4.1. Switch-Case Constructs

Switch-Case是一種條件分支結構，允許Parser根據不同條件的匹配結果執行相應的解析邏輯。

**語法結構**

```xml
<switch>
    <case>
        <!-- 匹配條件 1 -->
    </case>
    <case>
        <!-- 匹配條件 2 -->
    </case>
    <default>
        <!-- 處理所有未匹配的條件 -->
    </default>
</switch>
```

- 可以定義多個`<case>`，每個`<case>`內包含不同的匹配條件，解析器將由上而下檢查`<case>`中的條件，並執行第一個匹配的`<case>`。
- 當所有`<case>`條件均未匹配時，則執行`<default>`中的操作。不一定要設置`<default>`，但通常建議要設置以處理未匹配的情況。

**範例**

```planitext
<189>1 2025-01-17T10:30:45Z my-hostname FIREWALL - - - type=Login subtype=admin result=success user=admin from=192.168.1.1
```

```xml
<switch>
    <case>
        <collectFieldsByRegex src="$_rawmsg">
            <regex>
                <![CDATA[.*type=Login.*]]>
            </regex>
        </collectFieldsByRegex>
        <setEventAttribute attr="eventType">Login-Event</setEventAttribute>
    </case>

    <case>
        <collectFieldsByRegex src="$_rawmsg">
            <regex>
                <![CDATA[.*type=Logout.*]]>
            </regex>
        </collectFieldsByRegex>
        <setEventAttribute attr="eventType">Logout-Event</setEventAttribute>
    </case>

    <default>
        <setEventAttribute attr="eventType">Unknown-Event</setEventAttribute>
    </default>
</switch>
```

- 第一個 `<case>`：匹配登錄事件，如果日誌中包含 type=Login，設置 eventType 為 Login-Event。
- 第二個 `<case>`：匹配登出事件，如果日誌中包含 type=Logout，設置 eventType 為 Logout-Event。
- `<default>`：處理未匹配的情況，如果日誌不包含 type=Login 或 type=Logout，設置 eventType 為 Unknown-Event。

<div class="page-break"/>

#### 7.4.2. When-Test

When-Test可用於評估變數或屬性值是否滿足特定條件，若滿足的話就執行特定動作

**`=` 運算符**

- `<when test="$Attribute_Or_Variable = $Attribute_Or_Variable">`
- 用於檢查內容等於某值的情況。

```xml
<!-- 檢查 HTTP 狀態碼是否等於 200 -->
<when test='$httpStatusCode = "200"'>
    <setEventAttribute attr="eventType">HTTP_Success</setEventAttribute>
</when>
```

```xml
<!-- 檢查源 IP 和目標 IP 是否相同 -->
<when test='$srcIpAddr = $destIpAddr'>
    <setEventAttribute attr="eventType">Loopback_Detected</setEventAttribute>
</when>
```

**`!=` 運算符**

- `<when test="$Attribute_Or_Variable != "Value"">`
- 用於檢查內容不等於某值的情況。

```xml
<!-- 檢查 HTTP 狀態碼是否不是 200 -->
<when test='$httpStatusCode != "200"'>
    <setEventAttribute attr="eventType">HTTP_Error</setEventAttribute>
</when>
```

**`IN` 運算符**

- `<when test="$Attribute_Or_Variable IN "Value1, Value2, ValueN"">`
- 用於檢查屬性或變數的值是否存在於特定的值列表中。

```xml
<!-- 檢查 HTTP 狀態碼是否在允許的列表內 -->
<when test='$httpStatusCode IN "200, 201, 202, 204"'>
    <setEventAttribute attr="eventType">HTTP_Success</setEventAttribute>
</when>
```

**`exist` 運算符**

- `<when test='exist Attribute_Or_Variable'>`
- 使用 exist 運算符時，{==變數或屬性名稱前不需要加$符號==}。這是因為Parser僅檢查該屬性或變數是否存在，而不是檢查它的具體值。

```xml
<!-- 檢查用戶名是否存在 -->
<when test='exist user'>
    <setEventAttribute attr="eventType">User_Action</setEventAttribute>
</when>
```

**`not_exist` 運算符**

- `<when test='not_exist Attribute_Or_Variable'>`
- 測試屬性或變數是否不存在。

```xml
<!-- 檢查某特定屬性是否不存在 -->
<when test='not_exist srcIpAddr'>
    <setEventAttribute attr="eventType">Unknown_Source</setEventAttribute>
</when>
```

**`matches()` 功能**

- `<when test='matches($Attribute_Or_Variable, "Regex")'>`
- 檢查屬性或變數是否匹配特定的正則表達式。

```xml
<!-- 檢查用戶名是否以 'admin' 開頭 -->
<when test='matches($user, "^admin")'>
    <setEventAttribute attr="eventType">Admin_Action</setEventAttribute>
</when>
```

**`not_matches()` 功能**

- `<when test='not_matches($Attribute_Or_Variable, "Regex")'>`
- 檢查屬性或變數是否不匹配特定的正則表達式。

```xml
<!-- 檢查目標 IP 地址不匹配 IPV4 格式 -->
<when test='not_matches($destIpAddr, gPatIpV4Dot)'>
    <setEventAttribute attr="eventType">Invalid_IP</setEventAttribute>
</when>
```

<div class="page-break"/>

#### 7.4.3. Choose

- `Choose` 允許Parser針對多個條件進行判斷，並根據條件設定不同的解析邏輯。
- 使用 `<when>` 標籤來定義條件，並使用 `<otherwise>` 作為默認條件（當所有 `<when>` 條件都不符合時執行）。

**範例**

```xml
<!--根據 _logType 變數的值，分別將 eventType 設定為不同的值。當變數不符合指定條件時，會套用默認值 Generic-Event-->
<choose>
    <when test='$_logType = "Authentication"'>
        <setEventAttribute attr="eventType">Authentication-Event</setEventAttribute>
    </when>
    <when test='$_logType = "Transaction"'>
        <setEventAttribute attr="eventType">Transaction-Event</setEventAttribute>
    </when>
    <otherwise>
        <setEventAttribute attr="eventType">Generic-Event</setEventAttribute>
    </otherwise>
</choose>
```

```xml
<!--先檢查 user 是否存在，並根據其來源（LDAP 或 Radius）分別設置不同的事件類型。如果 user 不存在，則會檢查來源是否為 GuestWifi，並設定對應事件類型-->
<choose>
    <when test='exist user'>
        <choose>
            <when test='matches ($_source, "LDAP")'>
                <setEventAttribute attr="eventType">Student-LDAP-Login</setEventAttribute>
            </when>
            <when test='matches ($_source, "Radius")'>
                <setEventAttribute attr="eventType">Student-RADIUS-Login</setEventAttribute>
            </when>
        </choose>
    </when>
    <when test='not_exist user'>
        <when test='matches ($_source, "GuestWifi")'>
            <setEventAttribute attr="eventType">GuestWifi-Login</setEventAttribute>
        </when>
    </when>
</choose>
```

### 7.5. 自訂Parser流程

- 新增Device/App
- 新增Event Attributes
- 新增Event Types
- 新增Parsers

<div class="page-break"/>
