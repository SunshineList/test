-- 配置表 - 存储用户的配置文件信息
CREATE TABLE IF NOT EXISTS configs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('clash', 'singbox', 'shadowrocket', 'surge')),
    content TEXT NOT NULL,
    nodes TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    target TEXT NOT NULL,
    name TEXT,
    description TEXT,
    access_count INTEGER DEFAULT 0,
    -- 新增字段以支持前端UI联动
    custom_rules TEXT, -- JSON格式存储自定义规则
    custom_token TEXT, -- 自定义token
    is_linkable BOOLEAN DEFAULT 1, -- 是否可链接
    selected_rules TEXT, -- JSON格式存储选中的规则
    subscription_url TEXT -- 订阅链接
);

-- 节点表 - 存储代理节点信息
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vmess', 'vless', 'shadowsocks', 'trojan', 'hysteria', 'hysteria2')),
    name TEXT NOT NULL,
    server TEXT NOT NULL,
    port INTEGER NOT NULL,
    settings TEXT NOT NULL, -- JSON格式存储节点配置
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE
);

-- 访问日志表 - 记录配置文件的访问情况
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id TEXT,
    token TEXT,
    client_ip TEXT,
    user_agent TEXT,
    access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    request_path TEXT,
    response_status INTEGER,
    FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_configs_token ON configs(token);
CREATE INDEX IF NOT EXISTS idx_configs_type ON configs(type);
CREATE INDEX IF NOT EXISTS idx_configs_created_at ON configs(created_at);


CREATE INDEX IF NOT EXISTS idx_nodes_config_id ON nodes(config_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);

CREATE INDEX IF NOT EXISTS idx_nodes_sort_order ON nodes(sort_order);

CREATE INDEX IF NOT EXISTS idx_access_logs_config_id ON access_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_token ON access_logs(token);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_time ON access_logs(access_time);
CREATE INDEX IF NOT EXISTS idx_access_logs_client_ip ON access_logs(client_ip);

-- 创建触发器以自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_configs_updated_at
    AFTER UPDATE ON configs
    FOR EACH ROW
BEGIN
    UPDATE configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_nodes_updated_at
    AFTER UPDATE ON nodes
    FOR EACH ROW
BEGIN
    UPDATE nodes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 创建触发器以限制每个用户最多10个配置
CREATE TRIGGER IF NOT EXISTS limit_configs_per_user
    BEFORE INSERT ON configs
    FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (SELECT COUNT(*) FROM configs) >= 10
        THEN RAISE(ABORT, '最多只能创建10个配置文件')
    END;
END;

-- 创建触发器以在访问时更新访问计数
CREATE TRIGGER IF NOT EXISTS update_access_count
    AFTER INSERT ON access_logs
    FOR EACH ROW
    WHEN NEW.config_id IS NOT NULL
BEGIN
    UPDATE configs 
    SET access_count = access_count + 1 
    WHERE id = NEW.config_id;
END;