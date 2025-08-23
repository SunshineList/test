#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 定义两个KV命名空间
const KV_NAMESPACES = {
  SUBLINK_FULL_KV: 'SUBLINK_FULL_KV',
  TEMP_TOKENS: 'TEMP_TOKENS'
};

const WORKER_NAME = 'sublink-worker';
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

// 修改updateWranglerConfig函数
function updateWranglerConfig(namespaces) {
  console.log(`更新wrangler.toml文件...`);
  
  try {
    let config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    
    // 构建新的KV配置
    const kvConfig = Object.entries(namespaces)
      .map(([binding, id]) => `  { binding = "${binding}", id = "${id}" }`)
      .join(',\n');
    
    // 使用正则表达式查找并替换整个KV配置块
    const kvConfigRegex = /kv_namespaces\s*=\s*\[[\s\S]*?\]/;
    
    const newKvConfig = `kv_namespaces = [\n${kvConfig}\n]`;
    
    if (kvConfigRegex.test(config)) {
      config = config.replace(kvConfigRegex, newKvConfig);
    } else {
      config += `\n${newKvConfig}\n`;
    }
    
    fs.writeFileSync(WRANGLER_CONFIG_PATH, config);
    console.log('wrangler.toml文件已更新');
  } catch (error) {
    console.error('更新wrangler.toml文件失败:', error.message);
    process.exit(1);
  }
}

// 创建多个KV命名空间
function createKvNamespaces() {
  const namespaces = {};
  
  for (const [binding, namespace] of Object.entries(KV_NAMESPACES)) {
    const namespaceName = `${WORKER_NAME}-${namespace}`;
    console.log(`创建KV namespace: ${namespaceName}`);
    
    try {
      const output = runWranglerCommand(`kv namespace create "${namespaceName}"`);
      const match = output.match(/id = "([^"]+)"/);;
      
      if (match) {
        namespaces[binding] = match[1];
        console.log(`✅ ${binding} 创建成功，ID: ${match[1]}`);
      } else {
        console.error(`❌ 无法解析 ${binding} 的ID`);
        namespaces[binding] = 'PLACEHOLDER_KV_ID_PLEASE_REPLACE';
      }
    } catch (error) {
      console.error(`❌ 创建 ${binding} 失败:`, error.message);
      namespaces[binding] = 'PLACEHOLDER_KV_ID_PLEASE_REPLACE';
    }
  }
  
  return namespaces;
}

// 修改主函数
function main() {
  console.log('=== Sublink Worker KV存储初始化 ===\n');
  
  try {
    // 检查现有命名空间
    const output = runWranglerCommand('kv namespace list');
    const existingNamespaces = {};
    
    // 解析现有命名空间
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const namespaces = JSON.parse(jsonMatch[0]);
      
      for (const [binding, namespace] of Object.entries(KV_NAMESPACES)) {
        const namespaceName = `${WORKER_NAME}-${namespace}`;
        const existing = namespaces.find(ns => ns.title === namespaceName);
        
        if (existing) {
          console.log(`✅ ${binding} 已存在，ID: ${existing.id}`);
          existingNamespaces[binding] = existing.id;
        }
      }
    }
    
    // 创建缺失的命名空间
    const missingNamespaces = Object.keys(KV_NAMESPACES).filter(
      binding => !existingNamespaces[binding]
    );
    
    if (missingNamespaces.length > 0) {
      console.log(`需要创建的命名空间: ${missingNamespaces.join(', ')}`);
      const newNamespaces = createKvNamespaces();
      
      // 合并现有和新创建的命名空间
      const allNamespaces = { ...existingNamespaces, ...newNamespaces };
      updateWranglerConfig(allNamespaces);
    } else {
      console.log('所有KV命名空间都已存在，跳过创建');
    }
    
    console.log('\n✅ KV存储设置完成！');
    
  } catch (error) {
    console.error('\n❌ KV存储设置失败:', error.message);
    process.exit(1);
  }
}

main();
