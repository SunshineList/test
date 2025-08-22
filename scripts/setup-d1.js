// D1数据库初始化脚本
const { execSync } = require('child_process');

function runCommand(command) {
  try {
    console.log(`执行命令: ${command}`);
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`命令执行失败: ${error.message}`);
    throw error;
  }
}

async function setupD1() {
  console.log('=== Sublink Worker D1数据库初始化 ===\n');
  
  try {
    // 1. 创建D1数据库
    console.log('1. 创建D1数据库...');
    const createOutput = runCommand('wrangler d1 create sublink-worker-db');
    
    // 提取数据库ID
    const dbIdMatch = createOutput.match(/database_id = "([^"]+)"/);
    if (dbIdMatch) {
      const databaseId = dbIdMatch[1];
      console.log(`✅ 数据库创建成功，ID: ${databaseId}`);
      console.log('\n📝 请更新 wrangler.toml 文件中的 database_id:');
      console.log(`database_id = "${databaseId}"`);
      // 更新wrangler.toml文件
      const wranglerToml = fs.readFileSync('wrangler.toml', 'utf8');
      const updatedToml = wranglerToml.replace(/database_id = ".*"/, `database_id = "${databaseId}"`);
      fs.writeFileSync('wrangler.toml', updatedToml);
    }
    
    console.log('\n2. 初始化数据库表结构...');
    
    // 2. 创建配置表
    const createConfigsTable = `
      CREATE TABLE IF NOT EXISTS configs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        nodes TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        target TEXT NOT NULL
      );
    `;
    
    // 3. 创建索引
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_configs_token ON configs(token);
      CREATE INDEX IF NOT EXISTS idx_configs_type ON configs(type);
      CREATE INDEX IF NOT EXISTS idx_configs_created_at ON configs(created_at);
    `;
    
    console.log('创建配置表...');
    runCommand(`wrangler d1 execute sublink-worker-db --command "${createConfigsTable.replace(/\n/g, ' ').trim()}"`);
    
    console.log('创建索引...');
    runCommand(`wrangler d1 execute sublink-worker-db --command "${createIndexes.replace(/\n/g, ' ').trim()}"`);
    
    console.log('\n✅ 数据库初始化完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 更新 wrangler.toml 中的 database_id');
    console.log('2. 运行 npm run deploy 部署Worker');
    console.log('3. 设置管理员密码: wrangler secret put ADMIN_PASSWORD');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    console.log('\n🔧 请检查:');
    console.log('- 是否已安装并登录 wrangler CLI');
    console.log('- 是否有足够的 Cloudflare 权限');
  }
}

setupD1().catch(console.error);
