#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATABASE_NAME = 'sub-store-db';
const WRANGLER_CONFIG_PATH = path.join(__dirname, '..', 'wrangler.toml');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'database', 'seed.sql');

function runCommand(command) {
  try {
    console.log(`执行命令: ${command}`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    console.error(`错误信息: ${error.message}`);
    if (error.stdout) console.error(`标准输出: ${error.stdout}`);
    if (error.stderr) console.error(`标准错误: ${error.stderr}`);
    throw error;
  }
}

// 检查数据库是否存在
function checkDatabaseExists() {
  try {
    console.log('检查D1数据库是否存在...');
    const output = runCommand('npx wrangler d1 list');
    
    // 检查输出中是否包含我们的数据库名称
    if (output.includes(DATABASE_NAME)) {
      console.log(`✅ 数据库 "${DATABASE_NAME}" 已存在`);
      
      // 尝试从输出中提取数据库ID
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes(DATABASE_NAME)) {
          const idMatch = line.match(/([a-f0-9-]{36})/);
          if (idMatch) {
            return idMatch[1];
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log('检查数据库时出错，可能数据库不存在');
    return null;
  }
}

// 创建数据库
function createDatabase() {
  console.log(`创建D1数据库 "${DATABASE_NAME}"...`);
  const output = runCommand(`npx wrangler d1 create "${DATABASE_NAME}"`);
  
  // 提取数据库ID
  const dbIdMatch = output.match(/database_id = "([^"]+)"/);
  if (dbIdMatch) {
    const databaseId = dbIdMatch[1];
    console.log(`✅ 数据库创建成功，ID: ${databaseId}`);
    return databaseId;
  } else {
    throw new Error('无法从输出中提取数据库ID');
  }
}

// 更新wrangler.toml文件
function updateWranglerConfig(databaseId) {
  console.log('更新 wrangler.toml 文件...');
  
  try {
    let config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    
    // 使用正则表达式查找并替换数据库ID
    const dbConfigRegex = /database_id = "[^"]*"/;
    
    if (dbConfigRegex.test(config)) {
      config = config.replace(dbConfigRegex, `database_id = "${databaseId}"`);
      console.log('✅ 已更新现有的数据库ID配置');
    } else {
      console.log('⚠️  未找到现有的数据库ID配置，请手动添加');
    }
    
    fs.writeFileSync(WRANGLER_CONFIG_PATH, config);
    console.log('✅ wrangler.toml 文件已更新');
  } catch (error) {
    console.error('更新wrangler.toml文件失败:', error.message);
    throw error;
  }
}

// 执行数据库迁移
function runMigration() {
  console.log('执行数据库迁移...');
  
  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error(`Schema文件不存在: ${SCHEMA_PATH}`);
  }
  
  try {
    runCommand(`npx wrangler d1 execute "${DATABASE_NAME}" --file="${SCHEMA_PATH}"`);
    console.log('✅ 数据库迁移完成');
  } catch (error) {
    console.error('数据库迁移失败:', error.message);
    throw error;
  }
}

// 执行数据库种子数据
function runSeed() {
  console.log('插入种子数据...');
  
  if (!fs.existsSync(SEED_PATH)) {
    console.log('⚠️  种子数据文件不存在，跳过种子数据插入');
    return;
  }
  
  try {
    runCommand(`npx wrangler d1 execute "${DATABASE_NAME}" --file="${SEED_PATH}"`);
    console.log('✅ 种子数据插入完成');
  } catch (error) {
    console.error('种子数据插入失败:', error.message);
    console.log('⚠️  种子数据插入失败，但不影响主要功能');
  }
}

async function setupD1() {
  console.log('=== Sublink Worker D1数据库初始化 ===\n');
  
  try {
    // 1. 检查数据库是否存在
    let databaseId = checkDatabaseExists();
    
    // 2. 如果不存在则创建数据库
    if (!databaseId) {
      databaseId = createDatabase();
    }
    
    // 3. 更新wrangler.toml文件
    updateWranglerConfig(databaseId);
    
    // 4. 执行数据库迁移
    runMigration();
    
    // 5. 插入种子数据
    runSeed();
    
    console.log('\n✅ 数据库初始化完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 运行 npm run setup-kv 设置KV存储');
    console.log('2. 运行 npm run deploy 部署Worker');
    console.log('3. 设置管理员密码: npx wrangler secret put ADMIN_PASSWORD');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    console.log('\n🔧 请检查:');
    console.log('- 是否已安装并登录 wrangler CLI');
    console.log('- 是否有足够的 Cloudflare 权限');
    console.log('- 网络连接是否正常');
    process.exit(1);
  }
}

if (require.main === module) {
  setupD1().catch(console.error);
}

module.exports = { setupD1 };
