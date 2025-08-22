# Sublink Worker Full

> 基于 [7Sageer/sublink-worker](https://github.com/7Sageer/sublink-worker) 的增强版本，添加了配置管理、持久化存储和管理面板功能。

## 🙏 鸣谢

本项目基于 [7Sageer/sublink-worker](https://github.com/7Sageer/sublink-worker) 开发，感谢原作者的开源贡献！

原项目特点：
- 无需服务器，一键部署到 Cloudflare Workers
- 支持多种代理协议（ShadowSocks、VMess、VLESS、Hysteria2、Trojan、TUIC）
- 支持 Sing-Box、Clash、Xray/V2Ray 客户端
- 提供友好的 Web 界面和灵活的 API

## 🆕 新增功能

在原有功能基础上，本项目新增了以下特性：

### 🔐 用户认证系统
- 基于环境变量的登录保护
- JWT 会话管理，24小时有效期
- 安全的管理面板访问控制

### 💾 配置持久化存储
- 使用 Cloudflare D1 数据库存储配置
- 最多保存 10 条配置记录，自动管理存储空间
- 支持配置历史查看和管理

### 🎯 多客户端支持
- **Clash** - YAML 格式，Meta 内核兼容
- **Sing-box** - JSON 格式，现代化代理工具
- **Surge** - 配置文件格式，iOS/macOS 代理工具
- **Shadowrocket** - 使用 Surge 格式，iOS 代理应用

### 🔑 Token 订阅系统
- 为每个配置生成唯一访问 token
- 支持自定义 token
- 通过 token 进行远程订阅访问，无需登录

### 🖥️ 可视化管理面板
- 现代化的 Web 界面
- 配置创建、编辑、删除
- 订阅链接管理和二维码生成
- 实时配置预览

### 🔄 实时更新机制
- 节点变化时自动更新存储的配置
- 支持批量订阅链接处理
- 智能去重和合并

## 🚀 快速开始

### 1. 环境准备

确保已安装：
- Node.js (推荐 18+)
- Wrangler CLI
- Git

### 2. 获取代码

```bash
git clone <your-repo-url>
cd sublink-worker-full
npm install
```

### 3. 配置环境变量

#### 设置管理员账号

**方法一：使用脚本（推荐）**
```bash
npm run setup-admin
```

**方法二：手动设置**
```bash
# 设置管理员密码（推荐使用 secret）
wrangler secret put ADMIN_PASSWORD

# 或在 wrangler.toml 中设置用户名（可选）
# ADMIN_USER = "admin"  # 默认为 admin
```

### 4. 配置存储

#### D1 数据库初始化

```bash
# 初始化 D1 数据库（创建表结构和索引）
npm run setup-d1
```

#### 更新配置文件

确保 `wrangler.toml` 中配置正确：

```toml
[[d1_databases]]
binding = "SUBLINK_DB"
database_name = "sublink-worker-db"
database_id = "your-d1-database-id"

kv_namespaces = [
  { binding = "SUBLINK_FULL_KV", id = "your-kv-namespace-id" }
]

[vars]
ADMIN_USER = "admin"  # 可选，默认为 admin
```

### 5. 部署

```bash
npm run deploy
```

### 6. 访问管理面板

部署完成后访问：
- `https://your-worker-domain.workers.dev/` - 管理面板登录页

## 📋 功能详解

### 🔐 用户认证

- **登录页面**: `/login`
- **认证方式**: 环境变量 `ADMIN_USER` 和 `ADMIN_PASSWORD`
- **会话管理**: Cookie 中的 `session_token`，有效期 24 小时
- **安全登出**: `/logout`

### 💾 数据存储架构

#### D1 数据库（配置数据）
```sql
CREATE TABLE configs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,      -- JSON 格式的配置内容
    nodes TEXT NOT NULL,        -- JSON 格式的节点列表
    token TEXT UNIQUE NOT NULL, -- 唯一访问令牌
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    target TEXT NOT NULL        -- 目标客户端类型
);
```

#### KV 存储（临时数据）
- 短链接映射
- 临时配置缓存

### 🎯 客户端支持详情

| 客户端 | 配置格式 | 订阅路径 | 说明 |
|--------|----------|----------|------|
| Clash | YAML | `/clash?token=xxx` | Meta 内核兼容 |
| Sing-box | JSON | `/singbox?token=xxx` | 现代化代理工具 |
| Surge | 配置文件 | `/surge?token=xxx` | iOS/macOS 代理工具 |
| Shadowrocket | Surge 格式 | `/surge?token=xxx` | iOS 代理应用 |

### 🔑 Token 订阅系统

#### 特性
- **唯一性**: 每个配置生成唯一的 32 位 token
- **自定义**: 创建配置时可指定自定义 token
- **安全访问**: 通过 token 访问订阅，无需登录验证

#### 订阅 URL 格式
```
https://your-domain.workers.dev/clash?token=your-unique-token
https://your-domain.workers.dev/singbox?token=your-unique-token
https://your-domain.workers.dev/surge?token=your-unique-token
```

### 🖥️ 管理面板功能

#### 左侧面板
- **配置创建表单**: 选择类型、输入名称、添加订阅链接
- **规则选择**: 预定义规则集或自定义规则
- **实时预览**: 配置内容实时预览

#### 右侧面板
- **配置历史**: 最多显示 10 条配置记录
- **订阅管理**: 一键复制订阅链接
- **二维码生成**: 移动端扫码访问

#### 配置创建流程
1. 选择配置类型（Clash/Sing-box/Surge/Shadowrocket）
2. 输入配置名称
3. 添加订阅链接（支持多个，每行一个）
4. 选择规则集（预定义或自定义）
5. 可选：设置自定义 token
6. 点击创建，系统自动获取节点并生成配置

### 🔄 实时更新机制

#### 节点更新流程
1. 系统自动从订阅链接获取最新节点
2. 解析并去重节点信息
3. 更新存储的配置内容
4. 保持订阅链接可用性

#### 配置重建
- 添加新节点时自动重建配置
- 保持原有规则和设置
- 更新时间戳记录

## 🛠️ API 接口

### 配置管理 API

#### 获取配置列表
```http
GET /api/configs
```

#### 创建新配置
```http
POST /api/configs
Content-Type: application/json

{
  "type": "clash",
  "name": "我的配置",
  "subscriptionUrls": ["https://example.com/sub1", "https://example.com/sub2"],
  "selectedRules": ["Location:CN", "Google", "Youtube"],
  "customToken": "my-custom-token"
}
```

#### 获取配置详情
```http
GET /api/configs/{configId}
```

#### 删除配置
```http
DELETE /api/configs/{configId}
```

#### 更新配置节点
```http
POST /api/configs/{configId}/nodes
Content-Type: application/json

{
  "nodes": [...]
}
```

### 原有 API（兼容）

#### 配置生成
- `/singbox` - 生成 Sing-Box 配置
- `/clash` - 生成 Clash 配置
- `/surge` - 生成 Surge 配置

#### 短链接
- `/shorten` - 生成短链接
- `/shorten-v2` - 增强版短链接生成

## 📁 项目结构

```
sublink-worker-full/
├── src/
│   ├── handlers/
│   │   ├── auth.js              # 用户认证处理
│   │   └── configManagerD1.js   # D1 数据库配置管理
│   ├── adminHtmlBuilder.js      # 管理面板 HTML 生成
│   ├── index.js                 # Worker 主入口
│   ├── utils.js                 # 工具函数（JWT 等）
│   ├── BaseConfigBuilder.js     # 基础配置构建器
│   ├── ClashConfigBuilder.js    # Clash 配置构建器
│   ├── SingboxConfigBuilder.js  # Sing-box 配置构建器
│   ├── SurgeConfigBuilder.js    # Surge 配置构建器
│   ├── ProxyParsers.js          # 代理协议解析器
│   ├── htmlBuilder.js           # 原 Web 界面生成
│   ├── style.js                 # 样式文件
│   ├── config.js                # 配置文件
│   └── i18n/                    # 国际化
├── scripts/
│   ├── setup-admin.js           # 管理员账号设置脚本
│   ├── setup-d1.js              # D1 数据库初始化脚本
│   └── setup-kv.js              # KV 命名空间设置脚本
├── wrangler.toml                # Wrangler 配置文件
├── package.json                 # 项目依赖
└── README.md                    # 项目说明
```

## 🔧 配置说明

### 环境变量

```toml
[vars]
# 管理员用户名（可选，默认为 admin）
ADMIN_USER = "admin"

# 管理员密码（必须通过 secret 设置）
# wrangler secret put ADMIN_PASSWORD
```

### D1 数据库

```toml
[[d1_databases]]
binding = "SUBLINK_DB"
database_name = "sublink-worker-db"
database_id = "your-d1-database-id"
```

### KV 存储

```toml
kv_namespaces = [
  { binding = "SUBLINK_FULL_KV", id = "your-kv-namespace-id" }
]
```

## 🚨 注意事项

### 安全性
- **密码设置**: 务必使用 `wrangler secret put ADMIN_PASSWORD` 设置密码，避免明文存储
- **JWT 密钥**: 当前使用硬编码密钥，生产环境建议使用环境变量
- **访问控制**: 管理面板需要登录，订阅访问通过 token 验证

### 性能限制
- **D1 数据库**: 单行最大 1MB，数据库最大 1GB
- **KV 存储**: 单个值最大 25MB
- **Worker**: 单次请求超时 30 秒
- **配置数量**: 最多存储 10 条配置记录

### 数据持久性
- **D1 数据库**: 关系型数据库，数据可靠持久化
- **KV 存储**: 用于短链接等临时数据
- **自动清理**: 超过 10 条配置时自动删除最旧的

## 🔄 升级指南

### 从原版升级
1. 备份现有数据
2. 更新代码到新版本
3. 运行 `npm run setup-d1` 初始化 D1 数据库
4. 设置环境变量和密码
5. 重新部署：`npm run deploy`

### 从旧版本升级
1. 备份现有 KV 数据
2. 更新代码到新版本
3. 运行 D1 初始化脚本
4. 设置环境变量
5. 重新部署

## 🆘 故障排除

### 常见问题

**Q: 无法登录管理面板**
A: 检查是否已设置 `ADMIN_PASSWORD` secret，确认环境变量配置正确

**Q: 配置创建失败**
A: 检查订阅链接是否可访问，确认网络连接正常，查看 Worker 日志

**Q: 订阅链接无法使用**
A: 确认 token 正确，检查配置是否被意外删除，验证 D1 数据库连接

**Q: 节点数量为 0**
A: 检查订阅链接格式，确认链接返回有效的节点数据

### 调试方法

1. **检查 Worker 日志**
   ```bash
   wrangler tail
   ```

2. **验证 D1 数据库**
   ```bash
   wrangler d1 execute sublink-worker-db --command "SELECT COUNT(*) FROM configs;"
   ```

3. **检查环境变量**
   ```bash
   wrangler secret list
   ```

4. **浏览器调试**
   - 打开开发者工具查看网络请求
   - 检查控制台错误信息
   - 验证 Cookie 和会话状态

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## ⚠️ 免责声明

本项目仅供学习和交流使用，请勿用于非法用途。使用本项目产生的所有后果由用户自行承担，与开发者无关。


**再次感谢 [7Sageer/sublink-worker](https://github.com/7Sageer/sublink-worker) 的开源贡献！**
