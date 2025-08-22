// 管理页面HTML构建器
import { UNIFIED_RULES, PREDEFINED_RULE_SETS } from './config.js';
import { generateStyles } from './style.js';
import { t } from './i18n/index.js';

export function generateAdminHtml(configList = [], stats = {}) {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      ${generateAdminHead()}
      ${generateAdminBody(configList, stats)}
    </html>
  `;
}

const generateAdminHead = () => `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sublink Worker - 管理面板</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
      ${generateStyles()}
      ${generateAdminStyles()}
    </style>
  </head>
`;

const generateAdminStyles = () => `
  .admin-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 0;
    margin-bottom: 30px;
  }
  .stats-card {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    border: none;
    border-radius: 15px;
  }
  .config-card {
    border: none;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
  }
  .config-card:hover {
    transform: translateY(-5px);
  }
  .config-type-badge {
    font-size: 0.8em;
    padding: 0.3em 0.6em;
  }
  .main-container {
    display: flex;
    gap: 30px;
  }
  .left-panel {
    flex: 1;
  }
  .right-panel {
    flex: 1;
    max-height: 800px;
    overflow-y: auto;
  }
  .config-preview {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
  .config-list-item {
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .config-list-item:hover {
    background-color: #f8f9fa;
  }
  .config-list-item.active {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
  }
  .subscription-url {
    word-break: break-all;
    font-family: monospace;
    font-size: 0.9em;
  }
  .btn-logout {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }
`;

const generateAdminBody = (configList, stats) => `
  <body>
    ${generateLogoutButton()}
    ${generateAdminHeader(stats)}
    <div class="container-fluid">
      <div class="main-container">
        ${generateLeftPanel()}
        ${generateRightPanel(configList)}
      </div>
    </div>
    ${generateAdminScripts()}
  </body>
`;

const generateLogoutButton = () => `
  <a href="/logout" class="btn btn-outline-light btn-logout">
    <i class="fas fa-sign-out-alt me-2"></i>退出登录
  </a>
`;

const generateAdminHeader = (stats) => `
  <div class="admin-header">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-md-6">
          <h1 class="mb-0">
            <i class="fas fa-cogs me-3"></i>Sublink Worker 管理面板
          </h1>
          <p class="mb-0 mt-2">配置管理与订阅生成</p>
        </div>
        <div class="col-md-6">
          <div class="row text-center">
            <div class="col-4">
              <div class="stats-card card text-center p-3">
                <h3 class="mb-0">${stats.total || 0}</h3>
                <small>总配置数</small>
              </div>
            </div>
            <div class="col-4">
              <div class="stats-card card text-center p-3">
                <h3 class="mb-0">${stats.totalNodes || 0}</h3>
                <small>总节点数</small>
              </div>
            </div>
            <div class="col-4">
              <div class="stats-card card text-center p-3">
                <h3 class="mb-0">${Object.keys(stats.byType || {}).length}</h3>
                <small>配置类型</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const generateLeftPanel = () => `
  <div class="left-panel">
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-plus-circle me-2"></i>创建新配置
        </h5>
      </div>
      <div class="card-body">
        ${generateConfigForm()}
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-eye me-2"></i>配置预览
        </h5>
      </div>
      <div class="card-body">
        <div id="configPreview" class="config-preview">
          <p class="text-muted text-center">选择一个配置来预览</p>
        </div>
      </div>
    </div>
  </div>
`;

const generateRightPanel = (configList) => `
  <div class="right-panel">
    <div class="card h-100">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="fas fa-list me-2"></i>配置历史 (${configList.length}/10)
        </h5>
        <button class="btn btn-outline-primary btn-sm" onclick="refreshConfigList()">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
      <div class="card-body p-0">
        <div id="configList">
          ${generateConfigListItems(configList)}
        </div>
      </div>
    </div>
  </div>
`;

const generateConfigForm = () => `
  <form id="configForm">
    <div class="mb-3">
      <label for="configType" class="form-label">配置类型</label>
      <select class="form-select" id="configType" required>
        <option value="">选择配置类型</option>
        <option value="clash">Clash</option>
        <option value="singbox">Sing-box</option>
        <option value="surge">Surge</option>
        <option value="shadowrocket">Shadowrocket</option>
      </select>
    </div>
    
    <div class="mb-3">
      <label for="configName" class="form-label">配置名称</label>
      <input type="text" class="form-control" id="configName" placeholder="输入配置名称" required>
    </div>
    
    <div class="mb-3">
      <label for="subscriptionUrls" class="form-label">订阅链接</label>
      <textarea class="form-control" id="subscriptionUrls" rows="3" 
                placeholder="输入订阅链接，每行一个" required></textarea>
    </div>
    
    <div class="mb-3">
      <label for="customToken" class="form-label">自定义Token（可选）</label>
      <input type="text" class="form-control" id="customToken" 
             placeholder="不填写将自动生成">
    </div>
    
    ${generateRuleSelection()}
    
    <div class="d-grid">
      <button type="submit" class="btn btn-primary">
        <i class="fas fa-save me-2"></i>创建配置
      </button>
    </div>
  </form>
`;

const generateRuleSelection = () => `
  <div class="mb-3">
    <label class="form-label">规则选择</label>
    <select class="form-select mb-2" id="predefinedRules" onchange="applyPredefinedRules()">
      <option value="custom">自定义</option>
      <option value="minimal">最小规则集</option>
      <option value="balanced" selected>平衡规则集</option>
      <option value="comprehensive">完整规则集</option>
    </select>
    
    <div class="rule-checkboxes" id="ruleCheckboxes" style="max-height: 200px; overflow-y: auto;">
      ${UNIFIED_RULES.map(rule => `
        <div class="form-check form-check-inline">
          <input class="form-check-input rule-checkbox" type="checkbox" 
                 value="${rule.name}" id="rule_${rule.name}" name="selectedRules">
          <label class="form-check-label" for="rule_${rule.name}">
            ${t('outboundNames.' + rule.name)}
          </label>
        </div>
      `).join('')}
    </div>
  </div>
`;

const generateConfigListItems = (configList) => {
  if (!configList || configList.length === 0) {
    return `
      <div class="text-center p-4">
        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
        <p class="text-muted">暂无配置记录</p>
      </div>
    `;
  }

  return configList.map((config, index) => `
    <div class="config-list-item p-3 border-bottom" onclick="selectConfig('${config.id}')" data-config-id="${config.id}">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <h6 class="mb-1">
            <span class="badge bg-primary config-type-badge me-2">${config.type.toUpperCase()}</span>
            配置 #${index + 1}
          </h6>
          <p class="mb-1 text-muted small">
            <i class="fas fa-calendar me-1"></i>
            ${new Date(config.createdAt).toLocaleString('zh-CN')}
          </p>
          <p class="mb-2 text-muted small">
            <i class="fas fa-server me-1"></i>
            节点数: ${config.nodeCount || 0}
          </p>
          <div class="subscription-info">
            <p class="mb-1 small">
              <strong>订阅地址:</strong>
            </p>
            <div class="input-group input-group-sm">
              <input type="text" class="form-control subscription-url" 
                     value="${generateSubscriptionUrl(config.token, config.type)}" readonly>
              <button class="btn btn-outline-secondary" onclick="copySubscriptionUrl(this, event)">
                <i class="fas fa-copy"></i>
              </button>
              <button class="btn btn-outline-primary" onclick="generateQRCode('${generateSubscriptionUrl(config.token, config.type)}', event)">
                <i class="fas fa-qrcode"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-outline-danger btn-sm" onclick="deleteConfig('${config.id}', event)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

const generateSubscriptionUrl = (token, type) => {
  const baseUrl = window?.location?.origin || 'https://your-domain.workers.dev';
  const pathMap = {
    'clash': '/clash',
    'singbox': '/singbox',
    'surge': '/surge',
    'shadowrocket': '/surge'
  };
  const path = pathMap[type] || '/singbox';
  return `${baseUrl}${path}?token=${token}`;
};

const generateAdminScripts = () => `
  <script>
    ${generateApplyPredefinedRulesFunction()}
    ${generateConfigFormHandler()}
    ${generateConfigListHandlers()}
    ${generateUtilityFunctions()}
    ${generateInitialization()}
  </script>
`;

const generateApplyPredefinedRulesFunction = () => `
  function applyPredefinedRules() {
    const predefinedRules = document.getElementById('predefinedRules').value;
    const checkboxes = document.querySelectorAll('.rule-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if (predefinedRules === 'custom') {
      return;
    }

    const rulesToApply = ${JSON.stringify(PREDEFINED_RULE_SETS)};
    
    if (rulesToApply[predefinedRules]) {
      rulesToApply[predefinedRules].forEach(rule => {
        const checkbox = document.getElementById('rule_' + rule);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }
  }
`;

const generateConfigFormHandler = () => `
  document.getElementById('configForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const configType = formData.get('configType') || document.getElementById('configType').value;
    const configName = formData.get('configName') || document.getElementById('configName').value;
    const subscriptionUrls = document.getElementById('subscriptionUrls').value;
    const customToken = document.getElementById('customToken').value;
    
    // 获取选中的规则
    const selectedRules = Array.from(document.querySelectorAll('.rule-checkbox:checked'))
      .map(checkbox => checkbox.value);
    
    if (!configType || !configName || !subscriptionUrls) {
      alert('请填写所有必填字段');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>创建中...';
    
    try {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: configType,
          name: configName,
          subscriptionUrls: subscriptionUrls.split('\\n').filter(url => url.trim()),
          selectedRules,
          customToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('配置创建成功！');
        e.target.reset();
        document.getElementById('predefinedRules').value = 'balanced';
        applyPredefinedRules();
        await refreshConfigList();
      } else {
        alert('创建失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('创建配置失败:', error);
      alert('创建失败: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
`;

const generateConfigListHandlers = () => `
  async function refreshConfigList() {
    try {
      const response = await fetch('/api/configs');
      const result = await response.json();
      
      if (result.success) {
        updateConfigList(result.data);
        updateStats(result.stats);
      }
    } catch (error) {
      console.error('刷新配置列表失败:', error);
    }
  }
  
  function updateConfigList(configList) {
    const configListElement = document.getElementById('configList');
    if (configList.length === 0) {
      configListElement.innerHTML = \`
        <div class="text-center p-4">
          <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <p class="text-muted">暂无配置记录</p>
        </div>
      \`;
      return;
    }
    
    configListElement.innerHTML = configList.map((config, index) => \`
      <div class="config-list-item p-3 border-bottom" onclick="selectConfig('\${config.id}')" data-config-id="\${config.id}">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <span class="badge bg-primary config-type-badge me-2">\${config.type.toUpperCase()}</span>
              配置 #\${index + 1}
            </h6>
            <p class="mb-1 text-muted small">
              <i class="fas fa-calendar me-1"></i>
              \${new Date(config.createdAt).toLocaleString('zh-CN')}
            </p>
            <p class="mb-2 text-muted small">
              <i class="fas fa-server me-1"></i>
              节点数: \${config.nodeCount || 0}
            </p>
            <div class="subscription-info">
              <p class="mb-1 small">
                <strong>订阅地址:</strong>
              </p>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control subscription-url" 
                       value="\${generateSubscriptionUrl(config.token, config.type)}" readonly>
                <button class="btn btn-outline-secondary" onclick="copySubscriptionUrl(this, event)">
                  <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="generateQRCode('\${generateSubscriptionUrl(config.token, config.type)}', event)">
                  <i class="fas fa-qrcode"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="config-actions">
            <button class="btn btn-outline-danger btn-sm" onclick="deleteConfig('\${config.id}', event)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    \`).join('');
  }
  
  function updateStats(stats) {
    // 更新统计信息显示
    const statElements = document.querySelectorAll('.stats-card h3');
    if (statElements.length >= 3) {
      statElements[0].textContent = stats.total || 0;
      statElements[1].textContent = stats.totalNodes || 0;
      statElements[2].textContent = Object.keys(stats.byType || {}).length;
    }
  }
  
  async function selectConfig(configId) {
    // 移除之前的选中状态
    document.querySelectorAll('.config-list-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 添加当前选中状态
    const selectedItem = document.querySelector(\`[data-config-id="\${configId}"]\`);
    if (selectedItem) {
      selectedItem.classList.add('active');
    }
    
    // 获取配置详情并显示预览
    try {
      const response = await fetch(\`/api/configs/\${configId}\`);
      const result = await response.json();
      
      if (result.success) {
        displayConfigPreview(result.data);
      }
    } catch (error) {
      console.error('获取配置详情失败:', error);
    }
  }
  
  function displayConfigPreview(configData) {
    const previewElement = document.getElementById('configPreview');
    const contentPreview = typeof configData.content === 'object' 
      ? JSON.stringify(configData.content, null, 2)
      : configData.content;
    
    previewElement.innerHTML = \`
      <div class="mb-3">
        <h6>配置信息</h6>
        <table class="table table-sm">
          <tr><td><strong>类型:</strong></td><td>\${configData.type}</td></tr>
          <tr><td><strong>节点数:</strong></td><td>\${configData.nodes.length}</td></tr>
          <tr><td><strong>创建时间:</strong></td><td>\${new Date(configData.createdAt).toLocaleString('zh-CN')}</td></tr>
          <tr><td><strong>更新时间:</strong></td><td>\${new Date(configData.updatedAt).toLocaleString('zh-CN')}</td></tr>
        </table>
      </div>
      <div>
        <h6>配置内容预览</h6>
        <pre style="max-height: 300px; overflow-y: auto; font-size: 12px;">\${contentPreview.substring(0, 2000)}\${contentPreview.length > 2000 ? '\\n\\n... (内容过长，仅显示前2000字符)' : ''}</pre>
      </div>
    \`;
  }
  
  async function deleteConfig(configId, event) {
    event.stopPropagation();
    
    if (!confirm('确定要删除这个配置吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const response = await fetch(\`/api/configs/\${configId}\`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('配置删除成功');
        await refreshConfigList();
        
        // 清空预览
        document.getElementById('configPreview').innerHTML = 
          '<p class="text-muted text-center">选择一个配置来预览</p>';
      } else {
        alert('删除失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除配置失败:', error);
      alert('删除失败: ' + error.message);
    }
  }
`;

const generateUtilityFunctions = () => `
  function generateSubscriptionUrl(token, type) {
    const baseUrl = window.location.origin;
    const pathMap = {
      'clash': '/clash',
      'singbox': '/singbox',
      'surge': '/surge',
      'shadowrocket': '/surge'
    };
    const path = pathMap[type] || '/singbox';
    return \`\${baseUrl}\${path}?token=\${token}\`;
  }
  
  function copySubscriptionUrl(button, event) {
    event.stopPropagation();
    
    const input = button.parentElement.querySelector('input');
    input.select();
    document.execCommand('copy');
    
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-success');
    
    setTimeout(() => {
      button.innerHTML = originalIcon;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');
    }, 2000);
  }
  
  function generateQRCode(url, event) {
    event.stopPropagation();
    
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.max(2, Math.min(8, Math.floor(300 / moduleCount)));
      const margin = Math.floor(cellSize * 0.5);

      const qrImage = qr.createDataURL(cellSize, margin);
      
      const modal = document.createElement('div');
      modal.className = 'qr-modal';
      modal.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      \`;
      
      modal.innerHTML = \`
        <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 90vw;">
          <img src="\${qrImage}" alt="QR Code" style="max-width: 100%; height: auto;">
          <p style="margin-top: 15px; color: #333;">扫描二维码访问订阅</p>
          <button onclick="this.closest('.qr-modal').remove()" 
                  style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
            关闭
          </button>
        </div>
      \`;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });
    } catch (error) {
      console.error('生成二维码失败:', error);
      alert('生成二维码失败，URL可能过长');
    }
  }
`;

const generateInitialization = () => `
  document.addEventListener('DOMContentLoaded', function() {
    // 初始化默认规则选择
    applyPredefinedRules();
    
    // 加载配置列表
    refreshConfigList();
    
    // 规则复选框变化时自动切换到自定义
    document.querySelectorAll('.rule-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const predefinedSelect = document.getElementById('predefinedRules');
        if (predefinedSelect.value !== 'custom') {
          predefinedSelect.value = 'custom';
        }
      });
    });
  });
`;
