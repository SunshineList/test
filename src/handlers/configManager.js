// 配置存储管理模块
import { GenerateWebPath } from '../utils.js';

export class ConfigManager {
    constructor(env) {
        this.maxConfigs = 10; // 最多存储10条配置
        this.configPrefix = 'config:';
        this.indexKey = 'config:index';
        this.env = env;
    }

    // 获取配置索引
    async getConfigIndex() {
        const indexData = await this.env.SUBLINK_FULL_KV.get(this.indexKey);
        return indexData ? JSON.parse(indexData) : [];
    }

    // 更新配置索引
    async updateConfigIndex(index) {
        await this.env.SUBLINK_FULL_KV.put(this.indexKey, JSON.stringify(index));
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

    // 保存配置
    async saveConfig(type, content, nodes = [], userToken = null) {
        try {
            const configId = this.generateConfigId(type);
            const token = userToken || this.generateToken(configId);
            const createdAt = new Date().toISOString();

            // 验证配置格式
            let parsedContent;
            if (type === 'clash') {
                // 如果是YAML格式，保持原样；如果是JSON，转换
                if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
                    parsedContent = JSON.parse(content);
                } else {
                    parsedContent = content;
                }
            } else if (type === 'singbox') {
                parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
            } else {
                throw new Error('不支持的配置类型');
            }

            const configData = {
                id: configId,
                type,
                content: parsedContent,
                nodes: nodes || [],
                token,
                createdAt,
                updatedAt: createdAt,
                target: this.getTargetFromType(type)
            };

            // 获取当前配置索引
            const configIndex = await this.getConfigIndex();

            // 检查是否超过最大数量
            if (configIndex.length >= this.maxConfigs) {
                // 删除最旧的配置
                const oldestConfig = configIndex.shift();
                await this.env.SUBLINK_FULL_KV.delete(`${this.configPrefix}${oldestConfig.id}`);
            }

            // 保存配置
            await this.env.SUBLINK_FULL_KV.put(`${this.configPrefix}${configId}`, JSON.stringify(configData));

            // 更新索引
            configIndex.push({
                id: configId,
                type,
                token,
                createdAt,
                target: this.getTargetFromType(type),
                nodeCount: nodes.length
            });

            await this.updateConfigIndex(configIndex);

            return {
                success: true,
                configId,
                token,
                subscriptionUrl: this.generateSubscriptionUrl(token, type)
            };

        } catch (error) {
            console.error('保存配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取配置
    async getConfig(configId) {
        try {
            const configData = await this.env.SUBLINK_FULL_KV.get(`${this.configPrefix}${configId}`);
            return configData ? JSON.parse(configData) : null;
        } catch (error) {
            console.error('获取配置失败:', error);
            return null;
        }
    }

    // 通过token获取配置
    async getConfigByToken(token) {
        try {
            const configIndex = await this.getConfigIndex();
            const configInfo = configIndex.find(config => config.token === token);
            
            if (!configInfo) {
                return null;
            }

            return await this.getConfig(configInfo.id);
        } catch (error) {
            console.error('通过token获取配置失败:', error);
            return null;
        }
    }

    // 更新配置（添加节点）
    async updateConfigNodes(configId, newNodes) {
        try {
            const configData = await this.getConfig(configId);
            if (!configData) {
                return { success: false, error: '配置不存在' };
            }

            // 合并节点，避免重复
            const existingNodeIds = new Set(configData.nodes.map(node => node.tag || node.name));
            const uniqueNewNodes = newNodes.filter(node => !existingNodeIds.has(node.tag || node.name));
            
            configData.nodes = [...configData.nodes, ...uniqueNewNodes];
            configData.updatedAt = new Date().toISOString();

            // 重新生成配置内容
            configData.content = await this.rebuildConfig(configData);

            // 保存更新后的配置
            await this.env.SUBLINK_FULL_KV.put(`${this.configPrefix}${configId}`, JSON.stringify(configData));

            // 更新索引中的节点数量
            const configIndex = await this.getConfigIndex();
            const indexItem = configIndex.find(item => item.id === configId);
            if (indexItem) {
                indexItem.nodeCount = configData.nodes.length;
                await this.updateConfigIndex(configIndex);
            }

            return {
                success: true,
                nodeCount: configData.nodes.length
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
            // 删除配置数据
            await this.env.SUBLINK_FULL_KV.delete(`${this.configPrefix}${configId}`);

            // 更新索引
            const configIndex = await this.getConfigIndex();
            const updatedIndex = configIndex.filter(config => config.id !== configId);
            await this.updateConfigIndex(updatedIndex);

            return { success: true };

        } catch (error) {
            console.error('删除配置失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取所有配置列表
    async getConfigList() {
        return await this.getConfigIndex();
    }

    // 生成订阅URL
    generateSubscriptionUrl(token, type) {
        const baseUrl = window.location.origin; 
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
        const configIndex = await this.getConfigIndex();
        const stats = {
            total: configIndex.length,
            byType: {},
            totalNodes: 0
        };

        configIndex.forEach(config => {
            stats.byType[config.type] = (stats.byType[config.type] || 0) + 1;
            stats.totalNodes += config.nodeCount || 0;
        });

        return stats;
    }
}
