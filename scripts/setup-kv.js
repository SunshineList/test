#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KV_NAMESPACE = 'SUBLINK_FULL_KV';
const WORKER_NAME = 'sublink-worker'
const KV_NAMESPACE_NAME = `${WORKER_NAME}-${KV_NAMESPACE}`;
const LEGACY_KV_NAMESPACE_NAME = `${WORKER_NAME}-${WORKER_NAME}-${KV_NAMESPACE}`;  // 历史遗留的命名空间名称
const WRANGLER_CONFIG_PATH = path.join(__dirname, '..', 'wrangler.toml');

// 执行wrangler命令并返回结果
function runWranglerCommand(command) {
  try {
    console.log(`执行命令: npx wrangler ${command}`);
    return execSync(`npx wrangler ${command}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`执行命令失败: npx wrangler ${command}`);
    console.error(`错误信息: ${error.message}`);
    if (error.stdout) console.error(`标准输出: ${error.stdout}`);
    if (error.stderr) console.error(`标准错误: ${error.stderr}`);
    throw error;
  }
}

// 检查KV namespace是否存在
function checkKvNamespaceExists() {
  console.log(`正在检查KV namespace "${KV_NAMESPACE_NAME}"和"${LEGACY_KV_NAMESPACE_NAME}"是否存在...`);
  const output = runWranglerCommand('kv namespace list');
  
  try {
    // 尝试从输出中提取JSON部分（如果有）
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const namespaces = JSON.parse(jsonMatch[0]);
      // 优先检查当前命名格式的命名空间
      const primaryNamespace = namespaces.find(ns => ns.title === KV_NAMESPACE_NAME);
      if (primaryNamespace) {
        console.log(`找到命名空间: ${KV_NAMESPACE_NAME}`);
        return primaryNamespace;
      }
      
      // 如果当前格式不存在，检查遗留命名格式
      const legacyNamespace = namespaces.find(ns => ns.title === LEGACY_KV_NAMESPACE_NAME);
      if (legacyNamespace) {
        console.log(`找到遗留命名空间: ${LEGACY_KV_NAMESPACE_NAME}`);
        return legacyNamespace;
      }
      
      return null;
    }
    
    // 如果没有匹配到JSON格式，就使用正则表达式查找namespace
    // 首先尝试当前命名格式
    let namespaceRegex = new RegExp(`"${KV_NAMESPACE_NAME}"\\s*([a-zA-Z0-9-]+)`);
    let match = output.match(namespaceRegex);
    
    if (match) {
      console.log(`找到命名空间: ${KV_NAMESPACE_NAME}`);
      return { 
        title: KV_NAMESPACE_NAME, 
        id: match[1] 
      };
    }
    
    // 然后尝试遗留命名格式
    namespaceRegex = new RegExp(`"${LEGACY_KV_NAMESPACE_NAME}"\\s*([a-zA-Z0-9-]+)`);
    match = output.match(namespaceRegex);
    
    if (match) {
      console.log(`找到遗留命名空间: ${LEGACY_KV_NAMESPACE_NAME}`);
      return { 
        title: LEGACY_KV_NAMESPACE_NAME, 
        id: match[1] 
      };
    }
    
    return null;
  } catch (error) {
    console.error('解析KV namespace列表失败:', error.message);
    console.error('原始输出:', output);
    return null;
  }
}

// 创建KV namespace
function createKvNamespace() {
  console.log(`创建KV namespace "${KV_NAMESPACE_NAME}"...`);
  const output = runWranglerCommand(`kv namespace create "${KV_NAMESPACE}"`);
  
  try {
    // 尝试从输出中提取ID
    const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) {
      return { 
        title: KV_NAMESPACE_NAME, 
        id: idMatch[1] 
      };
    } else {
      throw new Error('无法从输出中提取KV namespace ID');
    }
  } catch (error) {
    console.error('解析创建KV namespace结果失败:', error.message);
    console.error('原始输出:', output);
    process.exit(1);
  }
}

// 更新wrangler.toml文件
function updateWranglerConfig(kvNamespaceId) {
  console.log(`更新wrangler.toml文件...`);
  
  try {
    let config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    
    // 使用正则表达式查找并替换KV namespace ID
    const kvConfigRegex = /kv_namespaces\s*=\s*\[\s*{\s*binding\s*=\s*"SUBLINK_FULL_KV"\s*,\s*id\s*=\s*"([^"]*)"\s*}\s*\]/;
    
    if (kvConfigRegex.test(config)) {
      config = config.replace(kvConfigRegex, `kv_namespaces = [\n  { binding = "SUBLINK_FULL_KV", id = "${kvNamespaceId}" }\n]`);
    } else {
      // 如果没有找到现有的KV配置，则添加新的配置
      config += `\nkv_namespaces = [\n  { binding = "SUBLINK_FULL_KV", id = "${kvNamespaceId}" }\n]\n`;
    }
    
    fs.writeFileSync(WRANGLER_CONFIG_PATH, config);
    console.log('wrangler.toml文件已更新');
  } catch (error) {
    console.error('更新wrangler.toml文件失败:', error.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('=== Sublink Worker KV存储初始化 ===\n');
  
  try {
    // 检查KV namespace是否存在
    let namespace = checkKvNamespaceExists();
    
    // 如果不存在，则创建
    if (!namespace) {
      console.log(`KV namespace "${KV_NAMESPACE_NAME}"不存在，正在创建...`);
      namespace = createKvNamespace();
      console.log(`✅ KV namespace "${KV_NAMESPACE_NAME}"创建成功，ID: ${namespace.id}`);
    } else {
      console.log(`✅ KV namespace "${namespace.title}"已存在，ID: ${namespace.id}`);
    }
    
    // 更新wrangler.toml文件
    updateWranglerConfig(namespace.id);
    
    console.log('\n✅ KV存储设置完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 运行 npm run deploy 部署Worker');
    console.log('2. 测试配置转换功能');
    
  } catch (error) {
    console.error('\n❌ KV存储设置失败:', error.message);
    console.log('\n🔧 请检查:');
    console.log('- 是否已安装并登录 wrangler CLI');
    console.log('- 是否有足够的 Cloudflare 权限');
    console.log('- 网络连接是否正常');
    process.exit(1);
  }
}

main();
