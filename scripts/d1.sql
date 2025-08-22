
-- 配置表：存储生成的配置与节点信息
CREATE TABLE IF NOT EXISTS configs (
  id            TEXT PRIMARY KEY,                     -- 配置ID（建议使用UUID）
  type          TEXT NOT NULL,                        -- 配置类型：singbox | clash | surge | shadowrocket ...
  token         TEXT NOT NULL UNIQUE,                 -- 订阅访问 token（唯一）
  config_data   TEXT NOT NULL,                        -- 配置元数据（整份表单序列化JSON）
  nodes_data    TEXT,                                 -- 节点数据（JSON 数组，按需存）
  node_count    INTEGER DEFAULT 0,                    -- 节点数量冗余字段，用于快速展示
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,   -- 创建时间
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP    -- 更新时间
);

-- 索引：常用查询维度
CREATE INDEX IF NOT EXISTS idx_configs_token       ON configs(token);
CREATE INDEX IF NOT EXISTS idx_configs_type        ON configs(type);
CREATE INDEX IF NOT EXISTS idx_configs_created_at  ON configs(created_at);

-- 触发器：更新时自动维护 updated_at
CREATE TRIGGER IF NOT EXISTS trg_configs_updated_at
AFTER UPDATE ON configs
FOR EACH ROW
BEGIN
  UPDATE configs
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- 触发器：插入后只保留最新 10 条配置（全局维度）
-- 注意：这会在全局范围控制总记录数最多 10 条；若你未来要按用户/命名空间维持上限，需要增加相应条件字段并调整 WHERE。
CREATE TRIGGER IF NOT EXISTS trg_configs_keep_latest_10
AFTER INSERT ON configs
BEGIN
  DELETE FROM configs
  WHERE id NOT IN (
    SELECT id FROM configs
    ORDER BY datetime(created_at) DESC
    LIMIT 10
  );
END;

-- 视图，便于前端轻量读取列表
CREATE VIEW IF NOT EXISTS v_configs_list AS
SELECT
  id,
  type,
  token,
  node_count,
  created_at,
  updated_at
FROM configs
ORDER BY datetime(created_at) DESC;
