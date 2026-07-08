# Changelog

所有 VTM Unity SDK 的重大變更都將記錄在此文件中。
基於 [語義化版本控制](https://semver.org/spec/v2.0.0.html) 與 [約定式提交](https://www.conventionalcommits.org/) 規範。

## [1.0.0] - 2025-12-15

### Added
- 【核心模組】初始發布 `VTM_Core` 模組：包含 `VTM.Core` 核心類、`Editor/VTM_Core.Editor` 編輯器工具及對應 DLL
- 【XR 模組】新增 `VTM_XR` 模組：含 `XRA` 腳本、`Resources/Prefabs` 基礎預製體、`UI` 模板
- 【iOS 模組】新增 `VTM_iOS` 模組：包含 `VTM.iOS` 核心邏輯、CPP 底層支援、`Frameworks/Graphic` 適配
- 【文件】新增 `Documents` 目錄：含 `Change_Log` 初始版本、`SDK_Guide` 接入文件、`License_Agreement` 授權協議
- 【框架】新增 `Frameworks` 目錄：包含 Graphic 核心框架、`Framework_Guide` 使用說明

### Changed
- 【統一配置】標準化所有模組的目錄結構（Editor/DLL/核心邏輯/Resources 分層）
- 【UI 規範】統一 `Scripts/UI` 目錄下的元件命名與介面設計

### Fixed
- 【編輯器】修復 `VTM_Core.Editor` 工具在 Unity 2021.3 版本下的相容性問題
- 【iOS 模組】解決 `VTM_iOS` 模組 `Prefabs` 載入路徑錯誤的 bug

## [0.3.0] - 2025-11-30

### Added
- 【XR 模組】新增 `VTM_XR` 模組的 `XRA` 場景模板（`Template` 目錄）
- 【編輯器】新增 `VTM_XR.Editor` 工具：支援 XR 設備參數可視化配置
- 【文件】新增 `Frameworks/Graphic` 模組的詳細使用指南（`Framework_Guide`）

### Changed
- 【效能優化】調整 `VTM_Core` 模組 `Scripts` 的執行頻率，降低效能開銷
- 【資源優化】壓縮 `VTM_iOS/Resources/Prefabs` 中的預製體體積

### Fixed
- 【XR 模組】修復 `VTM_XR` 模組 DLL 依賴缺失導致的啟動崩潰問題
- 【UI】修復 `VTM_iOS/Scripts/UI` 元件自適應佈局異常的 bug

## [0.2.0] - 2025-11-15

### Added
- 【iOS 模組】初始搭建 `VTM_iOS` 模組框架：包含 `Editor` 工具、`VTM.iOS` 核心類、CPP 底層目錄
- 【資源】新增 `VTM_iOS/Resources/Prefabs` 基礎預製體（如啟動頁、彈窗模板）
- 【腳本】新增 `VTM_iOS/Scripts/UI` 基礎元件（按鈕、輸入框、列表）

### Changed
- 【目錄規範】調整 `VTM_Core` 模組的 DLL 存放路徑，統一為 `模組名/DLL` 目錄
- 【文件】更新 `SDK_Guide`，補充 `VTM_iOS` 模組的接入流程

### Fixed
- 【核心模組】修復 `VTM_Core` 模組中 `VTM.Core` 類的空指標異常
- 【編輯器】解決 `VTM_Core.Editor` 工具匯出配置失敗的問題

## [0.1.0] - 2025-10-30

### Added
- 【核心模組】初始搭建 `VTM_Core` 模組：含 `VTM.Core` 核心邏輯、`Editor/VTM_Core.Editor` 基礎工具
- 【框架】新增 `Frameworks` 基礎目錄：包含 Graphic 核心框架雛形
- 【文件】初始建立 `Documents` 目錄：含 `Change_Log` 模板、`License_Agreement` 基礎條款

### Fixed
- 【基礎兼容】修復 `VTM_Core` 模組在 Unity 2020.3 版本下的編譯錯誤

## [0.0.1] - 2025-10-15

### Added
- 【專案初始化】建立 SDK 根目錄結構：`Assets/VTM/VTM_Unity` 核心目錄，包含模組佔位符、文件目錄雛形
- 【基礎配置】初始化 `VTM_Core` 模組的目錄結構（Editor/DLL/核心邏輯分層）
