// 基于D1数据库的配置存储管理模块
import { GenerateWebPath } from '../utils.js';

export class ConfigManager {
    constructor(env) {
        this.maxConfigs = 10; // 最多存储10条配置
        this.env = env;
        this.db = env.SUB_STORE_DB;
    }

    // 生成配置ID和Token
    generateConfigId(type) {
        const timestamp = Date.now();
        const random = GenerateWebPath(8);
        return `${type}_${timestamp}_${random}`;
    }

    generateToken(configId) {
        return GenerateWebPath(32);
    }

    async saveConfig(configData, nodes, customToken = null) {
        const id = generateId();
        const token = customToken || generateToken();
        const target = `${configData.type}-${Date.now()}`;
        
        const stmt = this.db.prepare(`
            INSERT INTO configs (
            id, type, content, nodes, token, target, name, description,
            custom_rules, custom_token, is_linkable, selected_rules, subscription_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        await stmt.bind(
            id,
            configData.type,
            configData.content,
            JSON.stringify(nodes),
            token,
            target,
            configData.name || null,
            configData.description || null,
            configData.customRules,
            configData.customToken,
            configData.isLinkable ? 1 : 0,
            configData.selectedRules,
            configData.subscriptionUrl
        ).run();
        
        return { id, token, target };
        }

    // 获取配置
    async getConfig(configId) {
        try {
            const config = await this.db.prepare('SELECT * FROM configs WHERE id = ?').bind(configId).first();
            if (!config) return null;

            return {
                ...config,
                content: JSON.parse(config.content),
                nodes: JSON.parse(config.nodes)
            };
        } catch (error) {
            console.error('获取配置失败:', error);
            return null;
        }
    }

    // 通过token获取配置
    async getConfigByToken(token) {
        try {
            const config = await this.db.prepare('SELECT * FROM configs WHERE token = ?').bind(token).first();
            if (!config) return null;

            return {
                ...config,
                content: JSON.parse(config.content),
                nodes: JSON.parse(config.nodes)
            };
        } catch (error) {
            console.error('通过token获取配置失败:', error);
            return null;
        }
    }

    // 更新配置节点
    async updateConfigNodes(configId, newNodes) {
        try {
            const config = await this.getConfig(configId);
            if (!config) {
                return { success: false, error: '配置不存在' };
            }

            // 合并节点，避免重复
            const existingNodeIds = new Set(config.nodes.map(node => node.tag || node.name));
            const uniqueNewNodes = newNodes.filter(node => !existingNodeIds.has(node.tag || node.name));
            
            const updatedNodes = [...config.nodes, ...uniqueNewNodes];
            const updatedAt = new Date().toISOString();

            // 重新生成配置内容
            const updatedContent = await this.rebuildConfig({
                ...config,
                nodes: updatedNodes
            });

            // 更新数据库
            const stmt = this.db.prepare(`
                UPDATE configs 
                SET nodes = ?, content = ?, updated_at = ? 
                WHERE id = ?
            `);

            await stmt.bind(
                JSON.stringify(updatedNodes),
                JSON.stringify(updatedContent),
                updatedAt,
                configId
            ).run();

            return {
                success: true,
                nodeCount: updatedNodes.length
            };

        } catch (error) {
            console.error('更新配置节点失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 重新构建配置
    async rebuildConfig(configData) {
        // 这里需要使用相应的ConfigBuilder来重新生成配置
        const { ClashConfigBuilder } = await import('../ClashConfigBuilder.js');
        const { SingboxConfigBuilder } = await import('../SingboxConfigBuilder.js');

        let builder;
        if (configData.type === 'clash') {
            builder = new ClashConfigBuilder('', [], [], configData.content, 'zh-CN', 'curl/7.74.0');
        } else if (configData.type === 'singbox') {
            builder = new SingboxConfigBuilder('', [], [], configData.content, 'zh-CN', 'curl/7.74.0');
        }

        if (builder) {
            // 添加节点到配置
            configData.nodes.forEach(node => {
                const convertedProxy = builder.convertProxy(node);
                if (convertedProxy) {
                    builder.addProxyToConfig(convertedProxy);
                }
            });

            return builder.formatConfig();
        }

        return configData.content;
    }

    // 删除配置
    async deleteConfig(configId) {
        try {
            const stmt = this.db.prepare('DELETE FROM configs WHERE id = ?');
            await stmt.bind(configId).run();

            return { success: true };

        } catch (error) {
            console.error('删除配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取配置列表
    async getConfigList() {
        try {
            const configs = await this.db.prepare(`
                SELECT id, type, token, created_at, updated_at, target, name, description, access_count,
                       JSON_ARRAY_LENGTH(nodes) as nodeCount
                FROM configs 
                ORDER BY created_at DESC
            `).all();

            return configs.results.map(config => ({
                ...config,
                createdAt: config.created_at,
                updatedAt: config.updated_at
            }));
        } catch (error) {
            console.error('获取配置列表失败:', error);
            return [];
        }
    }

    // 生成订阅URL
    generateSubscriptionUrl(token, type) {
        // 在服务器端无法获取 window.location，需要从请求中获取
        const baseUrl = 'https://your-worker-domain.workers.dev'; // 这里可以从环境变量获取
        const targetPath = this.getTargetPath(type);
        return `${baseUrl}${targetPath}?token=${token}`;
    }

    // 从类型获取目标客户端
    getTargetFromType(type) {
        const targetMap = {
            'clash': 'clash',
            'singbox': 'singbox',
            'surge': 'surge',
            'shadowrocket': 'shadowrocket'
        };
        return targetMap[type] || type;
    }

    // 获取目标路径
    getTargetPath(type) {
        const pathMap = {
            'clash': '/clash',
            'singbox': '/singbox',
            'surge': '/surge',
            'shadowrocket': '/surge' // shadowrocket使用surge格式
        };
        return pathMap[type] || '/singbox';
    }

    // 验证配置格式
    validateConfig(type, content) {
        try {
            if (type === 'clash') {
                // 简单验证clash配置
                if (typeof content === 'object') {
                    return content.proxies !== undefined || content['proxy-groups'] !== undefined;
                }
                return true; // YAML字符串，简单通过
            } else if (type === 'singbox') {
                const parsed = typeof content === 'string' ? JSON.parse(content) : content;
                return parsed.outbounds !== undefined;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // 获取配置统计信息
    async getConfigStats() {
        try {
            const totalResult = await this.db.prepare('SELECT COUNT(*) as total FROM configs').first();
            const typeStats = await this.db.prepare(`
                SELECT type, COUNT(*) as count 
                FROM configs 
                GROUP BY type
            `).all();
            
            const nodeStats = await this.db.prepare(`
                SELECT SUM(JSON_ARRAY_LENGTH(nodes)) as totalNodes 
                FROM configs
            `).first();

            const stats = {
                total: totalResult.total || 0,
                byType: {},
                totalNodes: nodeStats.totalNodes || 0
            };

            if (typeStats.results) {
                typeStats.results.forEach(stat => {
                    stats.byType[stat.type] = stat.count;
                });
            }

            return stats;
        } catch (error) {
            console.error('获取配置统计失败:', error);
            return {
                total: 0,
                byType: {},
                totalNodes: 0
            };
        }
    }

    // 清理过期配置（可选的维护功能）
    async cleanupOldConfigs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const stmt = this.db.prepare('DELETE FROM configs WHERE created_at < ?');
            const result = await stmt.bind(cutoffDate.toISOString()).run();
            
            return {
                success: true,
                deletedCount: result.changes
            };
        } catch (error) {
            console.error('清理过期配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 搜索配置
    async searchConfigs(query, type = null) {
        try {
            let sql = 'SELECT * FROM configs WHERE 1=1';
            const params = [];

            if (type) {
                sql += ' AND type = ?';
                params.push(type);
            }

            if (query) {
                sql += ' AND (id LIKE ? OR token LIKE ?)';
                params.push(`%${query}%`, `%${query}%`);
            }

            sql += ' ORDER BY created_at DESC';

            const stmt = this.db.prepare(sql);
            const results = await stmt.bind(...params).all();

            return (results.results || []).map(config => ({
                ...config,
                content: JSON.parse(config.content),
                nodes: JSON.parse(config.nodes),
                createdAt: config.created_at,
                updatedAt: config.updated_at
            }));
        } catch (error) {
            console.error('搜索配置失败:', error);
            return [];
        }
    }
}
