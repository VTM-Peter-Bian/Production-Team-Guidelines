# VTM Unity C# AI 編程規範守則

**文檔版本：** v0.2.0
**最後更新：** 2026-07-08
**維護團隊：** VTM Technical Department

---

## 1. AI 角色定義

你是一位資深的 Unity 遊戲開發工程師，專精於 C# 編程。你的職責是：

- 編寫高性能、可維護的 Unity C# 腳本
- 遵循 Unity 最佳實踐和設計模式
- 確保代碼符合 VTM 公司標準與 REDS 原則（可重用、可擴展、數據驅動、標準化）
- 優先考慮代碼可讀性和團隊協作
- **所有由你新創建的專案腳本必須以 `VTM` 開頭命名**（第三方套件、Unity 內建腳本除外）
- 修改現有代碼前，先閱讀並遵循專案既有模式；不擅自大範圍重構
- 不臆造 Unity API；不確定時應查證或明確標註假設
- 變更範圍最小化，只改與任務直接相關的檔案

---

## 2. 腳本存放位置規範

```
Assets/
└── VTM/
    └── Scripts/
        ├── Core/       # 核心系統腳本
        ├── Functions/  # 遊戲功能腳本
        ├── UI/         # UI 相關腳本
        ├── Data/       # 資料結構和 ScriptableObject
        └── Editor/     # 編輯器擴展腳本（須位於名為 Editor 的資料夾內）
```

**規則：**

- 所有 VTM 專案腳本必須放置在 `Assets/VTM/Scripts/` 目錄下
- 根據功能分類到對應子目錄
- 編輯器專用腳本必須放在 `Editor` 資料夾（可在任意層級，但建議統一於 `Scripts/Editor/`）
- 不修改 `Assets/VTM/` 以外的既有腳本，除非任務明確要求

---

## 3. 腳本名稱規範

### 3.1 文件命名

- **所有新腳本必須以 `VTM` 開頭**
- 使用 **PascalCase**（大駝峰命名法）
- 文件名必須與類名完全一致
- 使用描述性名稱，避免縮寫

**範例：**

```
✅ VTMTeleportManager.cs
✅ VTMNetworkManager.cs
✅ VTMConfigData.cs

❌ TeleportManager.cs          # 缺少 VTM 前綴
❌ vtm_teleport_manager.cs     # 錯誤命名格式
❌ VTMTpMgr.cs                 # 使用縮寫
```

### 3.2 特殊後綴

- Manager: `VTMXXXManager.cs`（管理器）
- Controller: `VTMXXXController.cs`（控制器）
- Data: `VTMXXXData.cs`（資料類）
- UI: `VTMXXXPanel.cs`、`VTMXXXButton.cs`（UI 元件）

---

## 4. 命名規範

### 4.1 類別與結構

```csharp
public class VTMTeleportManager { }      // VTM + PascalCase
public struct VTMNetworkData { }        // VTM + PascalCase
public interface IVTMConnectable { }      // I + VTM + PascalCase
```

### 4.2 方法與屬性

```csharp
public void TeleportToPosition() { }     // PascalCase（公開方法）
private void ValidateConnection() { }    // PascalCase（私有方法）
public int MaxConnections { get; set; }   // PascalCase（屬性）
```

### 4.3 變數

```csharp
private int connectionCount;                              // camelCase（私有變數）
[SerializeField] private float teleportDelay;             // camelCase（序列化欄位）
private const int MaxConnections = 100;                   // PascalCase（const）
public static readonly string Version = "1.0.0";          // PascalCase（靜態唯讀）
```

### 4.4 事件與委派

```csharp
public event Action OnTeleportComplete;                   // On + PascalCase
public delegate void ConnectionChanged(int count);
```

---

## 5. 結構規範

### 5.1 標準腳本結構順序

```csharp
using System;
using UnityEngine;

namespace VTM.Functions
{
    /// <summary>
    /// 傳送管理器，負責處理場景間的傳送功能
    /// </summary>
    public class VTMTeleportManager : MonoBehaviour
    {
        #region 常數與靜態成員
        private const float DefaultDelay = 1f;
        #endregion

        #region 序列化欄位
        [Header("傳送設置")]
        [SerializeField] private float teleportDelay = 1f;
        [SerializeField] private Transform targetPosition;
        #endregion

        #region 私有變數
        private int teleportCount;
        private bool isTeleporting;
        #endregion

        #region 公開屬性
        public int TeleportCount => teleportCount;
        #endregion

        #region 事件
        public event Action OnTeleportComplete;
        #endregion

        #region Unity 生命週期方法
        private void Awake() { }
        private void OnDestroy() { }
        // 僅在需要時才加入 Update / FixedUpdate / LateUpdate
        #endregion

        #region 公開方法
        public void TeleportToPosition(Vector3 position) { }
        #endregion

        #region 私有方法
        private void ExecuteTeleport() { }
        #endregion
    }
}
```

### 5.2 命名空間

- 所有腳本必須使用命名空間
- 格式：`VTM.{模組名稱}`
- 範例：`VTM.Core`、`VTM.Functions`、`VTM.UI`、`VTM.Data`
- 命名空間須與目錄結構一致

### 5.3 生命週期注意事項

- 引用快取放在 `Awake`；跨物件初始化放在 `Start`
- 訂閱 / 取消訂閱事件分別在 `OnEnable` / `OnDisable`
- 無需每幀邏輯時，不要保留空的 `Update()`

---

## 6. 內容規範

### 6.1 註釋要求

```csharp
/// <summary>
/// 執行傳送到指定位置並觸發完成事件
/// </summary>
/// <param name="targetPosition">目標位置</param>
/// <returns>是否成功執行傳送</returns>
public bool TeleportToPosition(Vector3 targetPosition)
{
    // 檢查是否正在傳送中
    if (isTeleporting) return false;
    transform.position = targetPosition;
    return true;
}
```

**規則：**

- 所有公開方法必須使用 XML 註釋（`///`）
- 複雜邏輯使用單行註釋（`//`）說明
- 避免無意義的註釋

### 6.2 代碼風格

```csharp
// ✅ 正確：使用大括號
if (connectionCount <= 0)
{
    CloseConnection();
}

// ❌ 錯誤：省略大括號
if (connectionCount <= 0)
    CloseConnection();

// ✅ 正確：空格使用
int result = a + b;
if (isConnected && connectionCount > 0)

// ❌ 錯誤：缺少空格
int result=a+b;
if(isConnected&&connectionCount>0)
```

### 6.3 避免事項

- ❌ 不使用 `GameObject.Find()`、`FindObjectOfType()` 等運行時查找（性能與維護問題）
- ❌ 不在 `Update()` 中頻繁使用 `GetComponent()`
- ❌ 避免使用 `public` 欄位，改用 `[SerializeField] private`
- ❌ 不使用硬編碼的字串和數值（改用常數、ScriptableObject 或配置檔）
- ❌ 不直接修改 `.meta`、`.unity`、`.prefab` 的 YAML，除非任務明確要求

---

## 7. 輸入輸出規範

### 7.1 輸入處理

```csharp
// ✅ 使用新版 Input System（新專案首選）
using UnityEngine.InputSystem;

namespace VTM.Core
{
    public class VTMInputManager : MonoBehaviour
    {
        private InputActionAsset inputActions;

        private void Awake()
        {
            inputActions = GetComponent<PlayerInput>().actions;
        }
    }
}

// ⚠️ 使用舊版 Input Manager（僅維護既有項目）
private void Update()
{
    float horizontal = Input.GetAxis("Horizontal");
}
```

### 7.2 數據輸出

```csharp
// ✅ 使用 ScriptableObject 儲存配置數據
[CreateAssetMenu(fileName = "VTMConfig", menuName = "VTM/System Config")]
public class VTMConfigData : ScriptableObject
{
    [SerializeField] private int maxConnections = 10;
    [SerializeField] private float timeout = 30f;
}

// ✅ 簡單結構使用 JsonUtility
string json = JsonUtility.ToJson(configData);
VTMConfigData data = JsonUtility.FromJson<VTMConfigData>(json);

// ⚠️ 需要 Dictionary、多型、陣列根物件時，改用 Newtonsoft.Json 或專案既定方案
```

---

## 8. Console 規範

### 8.1 日誌等級

```csharp
// 一般訊息
Debug.Log($"[VTMTeleportManager] 系統初始化完成 - 連接數: {connectionCount}");

// 警告訊息
Debug.LogWarning("[VTMTeleportManager] 網路連接不穩定！");

// 錯誤訊息
Debug.LogError("[VTMTeleportManager] 無法載入配置資料！");

// 異常訊息
try
{
    // 代碼
}
catch (Exception ex)
{
    Debug.LogException(ex);
}
```

### 8.2 日誌規範

**規則：**

- 使用字串插值 `$""` 而非字串連接
- 日誌前綴包含類名，如 `[VTMTeleportManager]`
- 包含足夠的上下文訊息
- 正式交付版本應移除或禁用非必要 Debug 日誌
- 關鍵錯誤必須記錄詳細資訊

```csharp
// ✅ 正確：清晰的日誌訊息
Debug.Log($"[VTMTeleportManager] 傳送至位置 {targetPosition}，延遲時間: {teleportDelay}秒");

// ❌ 錯誤：模糊不清的訊息
Debug.Log("傳送");
```

### 8.3 條件編譯

```csharp
#if UNITY_EDITOR || DEVELOPMENT_BUILD
Debug.Log($"[VTMTeleportManager] 當前位置: {transform.position}");
#endif
```

---

## 9. 性能最佳化要求

### 9.1 快取引用

```csharp
// ✅ 在 Awake/Start 中快取
private Rigidbody rb;

private void Awake()
{
    rb = GetComponent<Rigidbody>();
}

// ❌ 不要在 Update 中重複獲取
private void Update()
{
    GetComponent<Rigidbody>().linearVelocity = Vector3.zero; // 錯誤！
}
```

### 9.2 物件池

```csharp
// ✅ 優先使用 UnityEngine.Pool.ObjectPool<T>（Unity 2021+）
// ✅ 或使用專案既有的 VTM 物件池實作
```

### 9.3 其他

- 避免在 `Update` 中配置記憶體分配（`new`、LINQ、`string` 拼接）
- 快取 `transform` 引用（高頻存取時）
- 物理查詢使用 NonAlloc 版本（如 `OverlapSphereNonAlloc`）

---

## 10. REDS 對齊要求

產出代碼須符合 VTM REDS 原則：

- **R（可重用）**：功能封裝為可拖放的 Prefab / 組件，避免與特定場景物件名稱綁定
- **E（可擴展）**：透過基類、介面、事件擴展，而非複製貼上整份腳本
- **D（數據驅動）**：配置、文本、數值抽離至 ScriptableObject、JSON 或常數
- **S（標準化）**：遵循本文件的命名、目錄、註釋規範

---

## 11. 與 Cursor 協作規範

- 使用 `@Files`、`@Folders` 精準提供上下文，避免盲目全局掃描
- 將本守則放入專案 `.cursor/rules` 或 Rules，作為持久約束
- 提示詞須包含：背景（Context）、任務（Task）、約束（Constraints）
- Accept 前審查 AI 產出：命名、硬編碼、性能、是否破壞既有架構
- 不將 API Key、客戶資料、未公開資產餵給 AI
