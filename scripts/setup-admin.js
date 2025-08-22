// 设置管理员账号的脚本
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
  console.log('=== Sublink Worker 管理员账号设置 ===\n');
  
  const username = await question('请输入管理员用户名: ');
  const password = await question('请输入管理员密码: ');
  
  if (!username || !password) {
    console.log('❌ 用户名和密码不能为空');
    rl.close();
    return;
  }
  
  console.log('\n设置的管理员账号信息:');
  console.log(`用户名: ${username}`);
  console.log(`密码: ${password}`);
  
  const confirm = await question('\n确认设置这个账号吗? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ 操作已取消');
    rl.close();
    return;
  }
  
  console.log('\n📝 请手动执行以下命令来设置KV存储中的管理员账号:');
  console.log('-----------------------------------------------------');
  console.log(`wrangler kv:key put "USER" "${username}" --binding=SUBLINK_FULL_KV`);
  console.log(`wrangler kv:key put "PASSWORD" "${password}" --binding=SUBLINK_FULL_KV`);
  console.log('-----------------------------------------------------');
  console.log('\n✅ 命令已生成完成。执行上述命令后，您就可以使用这个账号登录管理面板了。');
  console.log('🌐 访问 https://your-worker-domain.workers.dev/ 来登录管理面板');
  
  rl.close();
}

setupAdmin().catch(console.error);
