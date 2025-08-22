# Sublink Worker - 新功能说明

## 🆕 新增功能概览

本次更新添加了完整的配置管理和持久化存储功能，主要包括：

1. **用户认证系统** - 登录保护管理面板
2. **配置持久化存储** - 最多存储10条配置记录
3. **多客户端支持** - 支持Clash、Sing-box、Surge、Shadowrocket
4. **Token订阅系统** - 为每个配置生成唯一访问token
5. **管理面板UI** - 可视化配置管理和历史记录
6. **实时配置更新** - 节点变化时自动更新存储的配置

## 🚀 快速开始

### 1. 设置管理员账号

首先需要在KV存储中设置管理员账号：

**方法一：使用脚本（推荐）**
```bash
# 运行账号设置脚本
npm run setup-admin

# 按提示输入用户名和密码，然后执行生成的命令
# 例如：
# wrangler kv:key put "USER" "admin" --binding=SUBLINK_FULL_KV
# wrangler kv:key put "PASSWORD" "your-password" --binding=SUBLINK_FULL_KV
```

**方法二：直接设置KV**
```bash
# 直接设置用户名和密码
wrangler kv:key put "USER" "admin" --binding=SUBLINK_FULL_KV
wrangler kv:key put "PASSWORD" "your-password" --binding=SUBLINK_FULL_KV
```

### 2. 部署Worker

```bash
npm run deploy
```

### 3. 访问管理面板

部署完成后，访问您的Worker域名：
- `https://your-worker-domain.workers.dev/` - 管理面板登录页

## 📋 功能详解

### 🔐 用户认证系统

- **简化登录**: 使用KV中的`USER`和`PASSWORD`字段进行验证
- **登录页面**: `/login` - 使用设置的用户名密码登录
- **会话管理**: 使用JWT token进行会话管理，有效期24小时
- **访问控制**: 所有管理功能需要登录后才能访问
- **安全登出**: `/logout` - 清除会话信息

### 💾 配置存储系统

#### 存储结构
```json
{
  "id": "clash_1703123456789_abc12345",
  "type": "clash",
  "content": {}, // 配置内容
  "nodes": [], // 节点列表
  "token": "unique-access-token",
  "createdAt": "2023-12-21T10:30:00.000Z",
  "updatedAt": "2023-12-21T10:30:00.000Z",
  "target": "clash"
}
```

#### 存储特性
- **数量限制**: 最多存储10条配置，超过时自动删除最旧的
- **自动清理**: 使用FIFO策略管理存储空间
- **持久化**: 所有配置存储在Cloudflare KV中

### 🎯 多客户端支持

支持以下客户端类型：

| 客户端 | 配置格式 | 订阅路径 | 说明 |
|--------|----------|----------|------|
| Clash | YAML | `/clash?token=xxx` | Meta内核兼容 |
| Sing-box | JSON | `/singbox?token=xxx` | 现代化代理工具 |
| Surge | 配置文件 | `/surge?token=xxx` | iOS/macOS代理工具 |
| Shadowrocket | Surge格式 | `/surge?token=xxx` | iOS代理应用 |

### 🔑 Token订阅系统

#### Token特性
- **唯一性**: 每个配置生成唯一的32位token
- **自定义**: 创建配置时可指定自定义token
- **安全访问**: 通过token访问订阅，无需登录

#### 订阅URL格式
```
https://your-domain.workers.dev/clash?token=your-unique-token
https://your-domain.workers.dev/singbox?token=your-unique-token
https://your-domain.workers.dev/surge?token=your-unique-token
```

### 🖥️ 管理面板功能

#### 主要功能区域
1. **左侧面板**:
   - 创建新配置表单
   - 配置内容实时预览

2. **右侧面板**:
   - 配置历史列表
   - 订阅地址管理
   - 二维码生成

#### 配置创建流程
1. 选择配置类型（Clash/Sing-box/Surge/Shadowrocket）
2. 输入配置名称
3. 添加订阅链接（支持多个）
4. 选择规则集（预定义或自定义）
5. 可选：设置自定义token
6. 点击创建，自动获取节点并生成配置

#### 配置管理操作
- **查看**: 点击配置项查看详细信息和预览
- **复制**: 一键复制订阅链接
- **二维码**: 生成二维码供移动端扫描
- **删除**: 删除不需要的配置

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

## 🛠️ API接口

### 配置管理API

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

## 📁 文件结构

```
src/
├── handlers/
│   ├── auth.js          # 用户认证处理
│   └── configManager.js # 配置存储管理
├── adminHtmlBuilder.js  # 管理面板HTML生成
├── index.js            # 主入口文件（已更新）
└── utils.js            # 工具函数（添加JWT支持）

scripts/
├── setup-admin.js      # 管理员账号设置脚本
└── setup-kv.js        # KV命名空间设置
```

## 🔧 配置说明

### KV存储配置
系统使用以下KV键值：
- `USER` - 管理员用户名
- `PASSWORD` - 管理员密码
- `config:index` - 配置索引
- `config:{configId}` - 具体配置数据

### KV命名空间绑定
确保 `wrangler.toml` 中正确配置了KV绑定：
```toml
[[kv_namespaces]]
binding = "SUBLINK_FULL_KV"
id = "your-kv-namespace-id"
```

## 🚨 注意事项

1. **安全性**: 
   - 管理员账号信息存储在KV的`USER`和`PASSWORD`字段中
   - 建议使用强密码
   - JWT密钥硬编码，生产环境建议使用环境变量

2. **性能**:
   - KV读写有一定延迟，创建配置可能需要几秒钟
   - 大量节点的配置生成会消耗更多CPU时间

3. **限制**:
   - 最多存储10条配置记录
   - 单个配置文件大小受KV限制（25MB）
   - 订阅链接需要可公开访问

## 🔄 升级指南

从旧版本升级：
1. 备份现有KV数据
2. 更新代码到新版本
3. 设置KV中的`USER`和`PASSWORD`字段
4. 重新部署：`npm run deploy`

## 🆘 故障排除

### 调试方法
1. 检查Cloudflare Worker日志
2. 使用浏览器开发者工具查看网络请求
3. 验证KV存储中的数据结构
4. 确认`USER`和`PASSWORD`字段已正确设置
