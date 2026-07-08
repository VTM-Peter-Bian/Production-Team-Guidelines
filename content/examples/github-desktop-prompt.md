# VTM GitHub Desktop 提交規範

**版本：** v0.1.0

---

請查看今天的代碼或資源變更，依以下規則撰寫 GitHub Desktop 提交訊息。

## 任務

1. 檢視本次修改的檔案與內容
2. 輸出可直接貼入 GitHub Desktop 的 **Summary** 與 **Description**
3. 提醒用戶在 GitHub Desktop 中手動 Commit 並 Push

## Summary 格式

```
yyyy-mm-dd Content Summary...
```

- 以當日日期開頭（`yyyy-mm-dd`）
- 英文一句話概括本次變更

範例：`2026-07-08 Update fire extinguisher 3D models and textures`

## Description 格式

以條列列出具體變更，每條以 `- ` 開頭：

```
- Add fire extinguisher 3D model (FBX)
- Update wall texture maps for Module A01
- Fix scene loading issue in Module A01
```

- 標明模組、場景、檔案或資源名稱
- 避免模糊表述（如 "fix bug"、"update files"）

## 輸出格式

```
Summary:
（填入 Summary）

Description:
（填入 Description）

---
請在 GitHub Desktop 中貼上以上內容，確認無誤後手動 Commit 並 Push。
```
