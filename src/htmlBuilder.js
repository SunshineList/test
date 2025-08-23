import { UNIFIED_RULES, PREDEFINED_RULE_SETS } from './config.js';
import { generateStyles } from './style.js';
import { t } from './i18n/index.js';

export function generateHtml(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      ${generateHead()}
      ${generateBody(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl)}
    </html>
  `;
}

const generateHead = () => `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${t('pageDescription')}">
    <meta name="keywords" content="${t('pageKeywords')}">
    <title>${t('pageTitle')}</title>
    <meta property="og:title" content="${t('ogTitle')}">
    <meta property="og:description" content="${t('ogDescription')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sublink-worker.sageer.me/">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
      ${generateStyles()}
    </style>
  </head>
`;

const generateBody = (xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) => `
  <body>
    ${generateDarkModeToggle()}
    ${generateGithubLink()}

    <div class="container-fluid mt-5">
      <div class="card mb-5">
        ${generateCardHeader()}
        <div class="card-body">
          <div class="row">
            <div class="col-lg-8">
              ${generateForm()}
              <div id="subscribeLinksContainer">
                ${generateSubscribeLinks(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl)}
              </div>
            </div>
            <div class="col-lg-4">
              ${generateConfigHistoryPanel()}
            </div>
          </div>
        </div>
      </div>
    </div>
    ${generateScripts()}
  </body>
`;

const generateDarkModeToggle = () => `
  <button id="darkModeToggle" class="btn btn-outline-secondary">
    <i class="fas fa-moon"></i>
  </button>
`;

const generateGithubLink = () => `
  <a href="https://github.com/SunshineList/test" target="_blank" rel="noopener noreferrer" class="github-link">
    <i class="fab fa-github"></i>
  </a>
`;

// const generateLoginButton = () => `
//   <a href="/admin" class="btn btn-outline-primary admin-link">
//     <i class="fas fa-cog me-2"></i>管理面板
//   </a>
// `;

const generateCardHeader = () => `
  <div class="card-header text-center">
    <h1 class="display-4 mb-0">Sublink Worker</h1>
  </div>
`;

// Form Components
const generateForm = () => `
  <form method="POST" id="encodeForm">
    ${generateShareUrlsSection()}
    ${generateAdvancedOptionsToggle()}
    ${generateAdvancedOptions()}
    ${generateButtonContainer()}
  </form>
`;

const generateShareUrlsSection = () => `
  <div class="form-section">
    <div class="form-section-title">${t('shareUrls')}</div>
    <textarea class="form-control" id="inputTextarea" name="input" required placeholder="${t('urlPlaceholder')}" rows="3"></textarea>
  </div>
`;

const generateAdvancedOptionsToggle = () => `
  <div class="form-check form-switch mb-3">
    <input class="form-check-input" type="checkbox" id="advancedToggle">
    <label class="form-check-label" for="advancedToggle">${t('advancedOptions')}</label>
  </div>
`;

const generateAdvancedOptions = () => `
  <div id="advancedOptions">
    ${generateRuleSetSelection()}
    ${generateBaseConfigSection()}
    ${generateTokenConfigSection()}
    ${generateUASection()}
  </div>
`;

const generateButtonContainer = () => `
  <div class="button-container d-flex gap-2 mt-4">
    <button type="submit" class="btn btn-primary flex-grow-1">
      <i class="fas fa-sync-alt me-2"></i>${t('convert')}
    </button>
    <button type="button" class="btn btn-outline-secondary" id="clearFormBtn">
      <i class="fas fa-trash-alt me-2"></i>${t('clear')}
    </button>
  </div>
`;

const generateSubscribeLinks = (xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) => `
  <div class="mt-4">
    ${generateLinkInput('Xray Link (Base64):', 'xrayLink', xrayUrl)}
    ${generateLinkInput('SingBox Link:', 'singboxLink', singboxUrl)}
    ${generateLinkInput('Clash Link:', 'clashLink', clashUrl)}
    ${generateLinkInput('Surge Link:', 'surgeLink', surgeUrl)}
    ${generateCustomPathSection(baseUrl)}
    ${generateShortenButton()}
  </div>
`;

const generateLinkInput = (label, id, value) => `
  <div class="mb-4">
    <label for="${id}" class="form-label">${label}</label>
    <div class="input-group">
      <span class="input-group-text"><i class="fas fa-link"></i></span>
      <input type="text" class="form-control" id="${id}" value="${value}" readonly>
      <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${id}')">
        <i class="fas fa-copy"></i>
      </button>
      <button class="btn btn-outline-secondary" type="button" onclick="generateQRCode('${id}')">
        <i class="fas fa-qrcode"></i>
      </button>
      <button class="btn btn-success" type="button" onclick="saveConfigFromUrl('${id}')">
        <i class="fas fa-save"></i>
      </button>
    </div>
  </div>
`;

const generateCustomPathSection = (baseUrl) => `
  <div class="mb-4 mt-3">
    <label for="customShortCode" class="form-label">${t('customPath')}</label>
    <div class="input-group flex-nowrap">
      <span class="input-group-text text-truncate" style="max-width: 400px;" title="${baseUrl}/s/">
        ${baseUrl}/s/
      </span>
      <input type="text" class="form-control" id="customShortCode" placeholder="e.g. my-custom-link">
      <select id="savedCustomPaths" class="form-select" style="max-width: 200px;">
        <option value="">${t('savedPaths')}</option>
      </select>
      <button class="btn btn-outline-danger" type="button" onclick="deleteSelectedPath()">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </div>
`;

const generateShortenButton = () => `
  <div class="d-grid mt-3">
    <button class="btn btn-primary btn-lg" type="button" onclick="shortenAllUrls()">
      <i class="fas fa-compress-alt me-2"></i>${t('shortenLinks')}
    </button>
  </div>
`;

const generateScripts = () => `
  <script>
    ${copyToClipboardFunction()}
    ${shortenAllUrlsFunction()}
    ${darkModeToggleFunction()}
    ${advancedOptionsToggleFunction()}
    ${applyPredefinedRulesFunction()}
    ${tooltipFunction()}
    ${submitFormFunction()}
    ${customRuleFunctions()}
    ${generateQRCodeFunction()}
    ${customPathFunctions()}
    ${generateRandomTokenFunction()}
    ${saveConfigFromUrl()}
    ${saveConfig()}
    ${clearConfig()}
    ${configHistoryFunctions()}
  </script>
`;

const generateRandomTokenFunction = () => `
  function generateRandomToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 更新token输入框
    const tokenInput = document.getElementById('customToken');
    if (tokenInput) {
      tokenInput.value = result;
    }
    
    return result;
  }
  
  function generatePermanentToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
`;

const saveConfigFromUrl = () => `
  async function saveConfigFromUrl(linkId) {
    const linkInput = document.getElementById(linkId);
    const configUrl = linkInput.value;
    
    if (!configUrl || configUrl.trim() === '') {
      alert('请先进行转换操作生成配置链接！');
      return;
    }
    
    // 获取配置类型
    let configType = '';
    let isLinkable = false; // 是否支持与左侧UI联动
    
    if (linkId === 'xrayLink') {
      configType = 'xray';
      isLinkable = false;
    } else if (linkId === 'singboxLink') {
      configType = 'singbox';
      isLinkable = true;
    } else if (linkId === 'clashLink') {
      configType = 'clash';
      isLinkable = true;
    } else if (linkId === 'surgeLink') {
      configType = 'surge';
      isLinkable = false;
    }
    
    // 获取保存按钮的引用
    const saveButton = linkInput.parentElement.querySelector('button[onclick*="saveConfigFromUrl"]');
    const originalText = saveButton.innerHTML;
    
    try {
      // 更新按钮状态
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      // 请求配置数据
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error('请求失败: ' + response.status);
      }
      
      let configContent;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        configContent = await response.json();
      } else {
        configContent = await response.text();
      }
      
      // 为配置生成一个新的永久token，不使用URL中的临时token
      const newToken = generatePermanentToken();
      
      // 准备保存的数据
      const saveData = {
        type: configType,
        subscriptionUrl: configUrl,
        customToken: newToken,
        content: configContent,
        isLinkable: isLinkable
      };
      
      // 如果是 clash 或 singbox，尝试获取左侧UI的规则选择
      if (isLinkable) {
        const selectedRules = Array.from(document.querySelectorAll('.rule-checkbox:checked'))
          .map(checkbox => checkbox.value);
        saveData.selectedRules = selectedRules;
        
        // 获取自定义规则
        const customRules = parseCustomRules();
        saveData.customRules = customRules;
      }
      
      // 发送保存请求 - 使用新的API端点来保存从URL生成的配置
      const saveResponse = await fetch('/api/configs/save-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(saveData)
      });
      
      const result = await saveResponse.json();
      
      if (result.success) {
        alert(configType.toUpperCase() + ' 配置保存成功！');
        
        // 如果有配置历史面板，刷新列表
        if (typeof refreshConfigHistory === 'function') {
          refreshConfigHistory();
        }
      } else {
        throw new Error(result.error || '保存失败');
      }
      
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败: ' + error.message);
    } finally {
      // 恢复按钮状态
      saveButton.disabled = false;
      saveButton.innerHTML = originalText;
    }
  }
`;
const customPathFunctions = () => `
  function updateSavedPathsDropdown() {
    const savedPaths = JSON.parse(localStorage.getItem('savedCustomPaths') || '[]');
    const dropdown = document.getElementById('savedCustomPaths');
    dropdown.innerHTML = '<option value="">Saved paths</option>';
    savedPaths.forEach(path => {
      const option = document.createElement('option');
      option.value = path;
      option.textContent = path;
      dropdown.appendChild(option);
    });
  }

  function loadSavedCustomPath() {
    const dropdown = document.getElementById('savedCustomPaths');
    const customShortCode = document.getElementById('customShortCode');
    if (dropdown.value) {
      customShortCode.value = dropdown.value;
    }
  }

  function deleteSelectedPath() {
    const dropdown = document.getElementById('savedCustomPaths');
    const selectedPath = dropdown.value;
    if (selectedPath) {
      let savedPaths = JSON.parse(localStorage.getItem('savedCustomPaths') || '[]');
      savedPaths = savedPaths.filter(path => path !== selectedPath);
      localStorage.setItem('savedCustomPaths', JSON.stringify(savedPaths));
      updateSavedPathsDropdown();
      document.getElementById('customShortCode').value = '';
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateSavedPathsDropdown();
    document.getElementById('savedCustomPaths').addEventListener('change', loadSavedCustomPath);
  });
`;

const advancedOptionsToggleFunction = () => `
  document.getElementById('advancedToggle').addEventListener('change', function() {
    const advancedOptions = document.getElementById('advancedOptions');
    if (this.checked) {
      advancedOptions.classList.add('show');
    } else {
      advancedOptions.classList.remove('show');
    }
  });
`;

const copyToClipboardFunction = () => `
  function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    
    const button = element.nextElementSibling;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-success');
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');
    }, 2000);
  }
`;

const shortenAllUrlsFunction = () => `
  let isShortening = false;

  async function shortenUrl(url, customShortCode) {
    // 保存自定义路径到localStorage
    if (customShortCode) {
      localStorage.setItem('customPath', customShortCode);
    }
    const response = await fetch(\`/shorten-v2?url=\${encodeURIComponent(url)}&shortCode=\${encodeURIComponent(customShortCode || '')}\`);
    if (response.ok) {
      const data = await response.text();
      return data;
    }
    throw new Error('Failed to shorten URL');
  }

  async function shortenAllUrls() {
    if (isShortening) {
      return;
    }

    const shortenButton = document.querySelector('button[onclick="shortenAllUrls()"]');
    
    try {
      isShortening = true;
      shortenButton.disabled = true;
      shortenButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Shortening...';

      const singboxLink = document.getElementById('singboxLink');
      const customShortCode = document.getElementById('customShortCode').value;

      if (singboxLink.value.includes('/b/')) {
        alert('Links are already shortened!');
        return;
      }

      const shortCode = await shortenUrl(singboxLink.value, customShortCode);

      const xrayLink = document.getElementById('xrayLink');
      const clashLink = document.getElementById('clashLink');
      const surgeLink = document.getElementById('surgeLink');

      xrayLink.value = window.location.origin + '/x/' + shortCode;
      singboxLink.value = window.location.origin + '/b/' + shortCode;
      clashLink.value = window.location.origin + '/c/' + shortCode;
      surgeLink.value = window.location.origin + '/s/' + shortCode;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to shorten URLs. Please try again.');
    } finally {
      isShortening = false;
      shortenButton.disabled = false;
      shortenButton.innerHTML = '<i class="fas fa-compress-alt me-2"></i>Shorten Links';
    }
  }
`;

const darkModeToggleFunction = () => `
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  darkModeToggle.addEventListener('click', () => {
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    darkModeToggle.innerHTML = body.getAttribute('data-theme') === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    darkModeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  } else if (systemDarkMode) {
    body.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Save theme preference when changed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        localStorage.setItem('theme', body.getAttribute('data-theme'));
      }
    });
  });

  observer.observe(body, { attributes: true });
`;

const generateRuleSetSelection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('ruleSelection')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('ruleSelectionTooltip')}
        </span>
      </span>
    </div>
    <div class="content-container mb-3">
      <select class="form-select" id="predefinedRules" onchange="applyPredefinedRules()">
        <option value="custom">${t('custom')}</option>
        <option value="minimal">${t('minimal')}</option>
        <option value="balanced">${t('balanced')}</option>
        <option value="comprehensive">${t('comprehensive')}</option>
      </select>
    </div>
    <div class="row" id="ruleCheckboxes">
      ${UNIFIED_RULES.map(rule => generateRuleCheckbox(rule)).join('')}
    </div>
    ${generateCustomRulesSection()}
  </div>
`;

const generateRuleCheckbox = (rule) => `
  <div class="col-md-4 mb-2">
    <div class="form-check">
      <input class="form-check-input rule-checkbox" type="checkbox" value="${rule.name}" id="${rule.name}" name="selectedRules">
      <label class="form-check-label" for="${rule.name}">${t('outboundNames.' + rule.name)}</label>
    </div>
  </div>
`;

const generateCustomRulesSection = () => `
  <div class="mt-2">
    <div class="custom-rules-section-header">
      <h5 class="custom-rules-section-title">${t('customRulesSection')}</h5>
      <span class="tooltip-icon">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('customRulesSectionTooltip')}
        </span>
      </span>
    </div>
    <div class="custom-rules-container">
      ${generateCustomRulesTabs()}
      ${generateCustomRulesContent()}
    </div>
  </div>
`;

const generateCustomRulesTabs = () => `
  <div class="custom-rules-tabs">
    <button type="button" class="custom-rules-tab active" onclick="switchCustomRulesTab('form')" id="formTab">
      <i class="fas fa-edit me-2"></i>${t('customRulesForm')}
    </button>
    <button type="button" class="custom-rules-tab" onclick="switchCustomRulesTab('json')" id="jsonTab">
      <i class="fas fa-code me-2"></i>${t('customRulesJSON')}
    </button>
  </div>
`;

const generateCustomRulesContent = () => `
  <div class="custom-rules-content">
    ${generateFormView()}
    ${generateJSONView()}
  </div>
`;

const generateFormView = () => `
  <div id="formView" class="custom-rules-view active">
    <div class="conversion-controls">
      <button type="button" class="btn btn-outline-primary btn-sm" onclick="addCustomRule()">
        <i class="fas fa-plus me-1"></i>${t('addCustomRule')}
      </button>
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearAllCustomRules()">
        <i class="fas fa-trash me-1"></i>${t('clearAll')}
      </button>
    </div>
    <div id="customRules">
      <!-- Custom rules will be dynamically added here -->
    </div>
    <div id="emptyFormMessage" class="empty-state" style="display: none;">
      <i class="fas fa-plus-circle fa-2x mb-2"></i>
      <p>${t('noCustomRulesForm')}</p>
    </div>
  </div>
`;

const generateJSONView = () => `
  <div id="jsonView" class="custom-rules-view">
    <div class="conversion-controls">
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearAllCustomRules()">
        <i class="fas fa-trash me-1"></i>${t('clearAll')}
      </button>
    </div>
    <div id="customRulesJSON">
      <div class="mb-2">
        <label class="form-label">${t('customRuleJSON')}</label>
        <div class="json-textarea-container">
          <textarea class="form-control json-textarea" name="customRuleJSON[]" rows="15"
                    oninput="validateJSONRealtime(this)"></textarea>
          <div class="json-validation-message" style="display: none;"></div>
        </div>
      </div>
    </div>
  </div>
`;

const generateBaseConfigSection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('baseConfigSettings')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('baseConfigTooltip')}
        </span>
      </span>
    </div>
    <div class="mb-3">
      <select class="form-select" id="configType">
        <option value="singbox">SingBox (JSON)</option>
        <option value="clash">Clash (YAML)</option>
      </select>
    </div>
    <div class="mb-3">
      <textarea class="form-control" id="configEditor" rows="3" placeholder="Paste your custom config here..."></textarea>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-secondary" onclick="saveConfig()">${t('saveConfig')}</button>
      <button type="button" class="btn btn-outline-danger" onclick="clearConfig()">
        <i class="fas fa-trash-alt me-2"></i>${t('clearConfig')}
      </button>
    </div>
  </div>
`;

const generateTokenConfigSection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      <i class="fas fa-key me-2"></i>
      Token配置
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          配置自定义Token用于订阅链接访问，留空则自动生成
        </span>
      </span>
    </div>
    <div class="form-section-content">
      <div class="mb-3">
        <label for="customToken" class="form-label">自定义Token</label>
        <div class="input-group">
          <input type="text" class="form-control" id="customToken" name="customToken" 
                 placeholder="留空自动生成唯一Token">
          <button type="button" class="btn btn-outline-secondary" onclick="generateRandomToken()">
            <i class="fas fa-dice me-1"></i>随机生成
          </button>
        </div>
        <div class="form-text">
          <i class="fas fa-info-circle me-1"></i>
          Token用于生成唯一的订阅链接，支持字母、数字和下划线
        </div>
      </div>
    </div>
  </div>
`;

const generateUASection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('UASettings')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('UAtip')}
        </span>
      </span>
    </div>
    <input type="text" class="form-control" id="customUA" placeholder="curl/7.74.0">
  </div>
`;

const applyPredefinedRulesFunction = () => `
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
    
    rulesToApply[predefinedRules].forEach(rule => {
      const checkbox = document.getElementById(rule);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
  }

  // Add event listeners to checkboxes
  document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.rule-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const predefinedSelect = document.getElementById('predefinedRules');
        if (predefinedSelect.value !== 'custom') {
          predefinedSelect.value = 'custom';
        }
      });
    });
  });
`;

const tooltipFunction = () => `
  function initTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-icon');
    tooltips.forEach(tooltip => {
      tooltip.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = tooltip.querySelector('.tooltip-content');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });

    document.addEventListener('click', () => {
      const openTooltips = document.querySelectorAll('.tooltip-content[style="display: block;"]');
      openTooltips.forEach(tooltip => {
        tooltip.style.display = 'none';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initTooltips);
`;

const submitFormFunction = () => `
  async function submitForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const inputString = formData.get('input');

    const userAgent = document.getElementById('customUA').value;
    
    // Save form data to localStorage
    localStorage.setItem('inputTextarea', inputString);
    localStorage.setItem('advancedToggle', document.getElementById('advancedToggle').checked);

    // Save UserAgent data to localStorage
    localStorage.setItem('userAgent', document.getElementById('customUA').value);
    
    // Save configEditor and configType to localStorage
    localStorage.setItem('configEditor', document.getElementById('configEditor').value);
    localStorage.setItem('configType', document.getElementById('configType').value);
    
    let selectedRules;
    const predefinedRules = document.getElementById('predefinedRules').value;
    if (predefinedRules !== 'custom') {
      selectedRules = predefinedRules;
    } else {
      selectedRules = Array.from(document.querySelectorAll('input[name="selectedRules"]:checked'))
        .map(checkbox => checkbox.value);
    }
    
    const configEditor = document.getElementById('configEditor');
    const configId = new URLSearchParams(window.location.search).get('configId') || '';

    const customRules = parseCustomRules();
    
    // 获取或生成token
    const customToken = document.getElementById('customToken')?.value || '';
    let token = customToken;
    if (!token) {
      // 每次都生成新的唯一token
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        token = crypto.randomUUID().replace(/-/g, '');
      } else {
        token = Date.now().toString(36) + Math.random().toString(36).substr(2);
      }
      
      if (document.getElementById('customToken')) {
        document.getElementById('customToken').value = token;
      }
      
      // 将token存储到KV（通过API调用）
      try {
        await fetch('/api/store-temp-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
      } catch (error) {
        console.error('存储临时token失败:', error);
      }
    }else{
      // 将token存储到KV（通过API调用）
      try {
        await fetch('/api/store-temp-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
      } catch (error) {
        console.error('存储临时token失败:', error);
      }
    }

    const configParam = configId ? \`&configId=\${configId}\` : '';
    const tokenParam = \`&token=\${token}\`;
    const xrayUrl = \`\${window.location.origin}/xray?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}\${configParam}\${tokenParam}\`;
    const singboxUrl = \`\${window.location.origin}/singbox?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\${tokenParam}\`;
    const clashUrl = \`\${window.location.origin}/clash?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\${tokenParam}\`;
    const surgeUrl = \`\${window.location.origin}/surge?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\${tokenParam}\`;
    document.getElementById('xrayLink').value = xrayUrl;
    document.getElementById('singboxLink').value = singboxUrl;
    document.getElementById('clashLink').value = clashUrl;
    document.getElementById('surgeLink').value = surgeUrl;
    // Show the subscribe part
    const subscribeLinksContainer = document.getElementById('subscribeLinksContainer');
    subscribeLinksContainer.classList.remove('hide');
    subscribeLinksContainer.classList.add('show');

    // Scroll to the subscribe part
    subscribeLinksContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function parseUrlAndFillForm(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Parse base configuration
      const config = params.get('config');
      if (config) {
        const decodedConfig = decodeURIComponent(config);
        document.getElementById('inputTextarea').value = decodedConfig;
      }

      // Parse UserAgent
      const ua = params.get('ua');
      if (ua) {
        document.getElementById('customUA').value = decodeURIComponent(ua);
      }

      // Parse rule selection
      const selectedRules = params.get('selectedRules');
      if (selectedRules) {
        try {
          const decodedRules = decodeURIComponent(selectedRules).replace(/^"|"$/g, '');
          // Check if it's a predefined rule set
          if (['minimal', 'balanced', 'comprehensive'].includes(decodedRules)) {
            const predefinedRules = document.getElementById('predefinedRules');
            predefinedRules.value = decodedRules;
            // Apply predefined rules to checkboxes
            const rulesToApply = ${JSON.stringify(PREDEFINED_RULE_SETS)};
            const checkboxes = document.querySelectorAll('.rule-checkbox');
            checkboxes.forEach(checkbox => {
              checkbox.checked = rulesToApply[decodedRules].includes(checkbox.value);
            });
          } else {
            // Handle custom rules (JSON array)
            const rules = JSON.parse(decodedRules);
            if (Array.isArray(rules)) {
              document.getElementById('predefinedRules').value = 'custom';
              const checkboxes = document.querySelectorAll('.rule-checkbox');
              checkboxes.forEach(checkbox => {
                checkbox.checked = rules.includes(checkbox.value);
              });
            }
          }
        } catch (e) {
          console.error('Error parsing selected rules:', e);
        }
      }

      // Parse custom rules
      const customRules = params.get('customRules');
      if (customRules) {
        try {
          const rules = JSON.parse(decodeURIComponent(customRules));
          if (Array.isArray(rules) && rules.length > 0) {
            // Clear existing custom rules
            document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
            
            // Switch to JSON view and write rules
            switchCustomRulesTab('json');
            const jsonTextarea = document.querySelector('#customRulesJSON textarea');
            if (jsonTextarea) {
              jsonTextarea.value = JSON.stringify(rules, null, 2);
              validateJSONRealtime(jsonTextarea);
            }
          }
        } catch (e) {
          console.error('Error parsing custom rules:', e);
        }
      }

      // Parse configuration ID
      const configId = params.get('configId');
      if (configId) {
        // Fetch configuration content
        fetch(\`/config?type=singbox&id=\${configId}\`)
          .then(response => response.json())
          .then(data => {
            if (data.content) {
              document.getElementById('configEditor').value = data.content;
              document.getElementById('configType').value = data.type || 'singbox';
            }
          })
          .catch(error => console.error('Error fetching config:', error));
      }

      // Show advanced options
      document.getElementById('advancedToggle').checked = true;
      document.getElementById('advancedOptions').classList.add('show');
    } catch (e) {
      console.error('Error parsing URL:', e);
    }
  }

  // 检测是否是短链
  function isShortUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts.length >= 3 && ['b', 'c', 'x', 's'].includes(pathParts[1]) && pathParts[2];
    } catch (error) {
      return false;
    }
  }

  // 自动解析短链
  async function autoResolveShortUrl(shortUrl) {
    try {
      const response = await fetch(\`/resolve?url=\${encodeURIComponent(shortUrl)}\`);
      
      if (response.ok) {
        const data = await response.json();
        const originalUrl = data.originalUrl;
        
        // 用原始URL替换输入框中的短链
        document.getElementById('inputTextarea').value = originalUrl;
        
        // 解析原始URL到表单
        parseUrlAndFillForm(originalUrl);
        
        return true;
      } else {
        console.error('Failed to resolve short URL:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error resolving short URL:', error);
      return false;
    }
  }

  // Add input box event listener
  document.addEventListener('DOMContentLoaded', function() {
    const inputTextarea = document.getElementById('inputTextarea');
    let lastValue = '';
    
    inputTextarea.addEventListener('input', async function() {
      const currentValue = this.value.trim();
      
      if (currentValue && currentValue !== lastValue) {
        // 首先检查是否是短链
        if (isShortUrl(currentValue)) {
          await autoResolveShortUrl(currentValue);
        }
        // 然后检查是否是项目生成的完整链接
        else if (currentValue.includes('/singbox?') || 
                 currentValue.includes('/clash?') || 
                 currentValue.includes('/surge?') || 
                 currentValue.includes('/xray?')) {
          parseUrlAndFillForm(currentValue);
        }
      }
      
      lastValue = currentValue;
    });
  });

  function loadSavedFormData() {
    const savedInput = localStorage.getItem('inputTextarea');
    if (savedInput) {
      document.getElementById('inputTextarea').value = savedInput;
    }

    const advancedToggle = localStorage.getItem('advancedToggle');
    if (advancedToggle) {
      document.getElementById('advancedToggle').checked = advancedToggle === 'true';
      if (advancedToggle === 'true') {
        document.getElementById('advancedOptions').classList.add('show');
      }
    }
    
    // Load userAgent
    const savedUA = localStorage.getItem('userAgent');
    if (savedUA) {
      document.getElementById('customUA').value = savedUA;
    }
    
    // Load configEditor and configType
    const savedConfig = localStorage.getItem('configEditor');
    const savedConfigType = localStorage.getItem('configType');
    
    if (savedConfig) {
      document.getElementById('configEditor').value = savedConfig;
    }
    if (savedConfigType) {
      document.getElementById('configType').value = savedConfigType;
    }
    
    const savedCustomPath = localStorage.getItem('customPath');
    if (savedCustomPath) {
      document.getElementById('customShortCode').value = savedCustomPath;
    }

    loadSelectedRules();
  }

  function saveSelectedRules() {
    const selectedRules = Array.from(document.querySelectorAll('input[name="selectedRules"]:checked'))
      .map(checkbox => checkbox.value);
    localStorage.setItem('selectedRules', JSON.stringify(selectedRules));
    localStorage.setItem('predefinedRules', document.getElementById('predefinedRules').value);
  }

  function loadSelectedRules() {
    const savedRules = localStorage.getItem('selectedRules');
    if (savedRules) {
      const rules = JSON.parse(savedRules);
      rules.forEach(rule => {
        const checkbox = document.querySelector(\`input[name="selectedRules"][value="\${rule}"]\`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    const savedPredefinedRules = localStorage.getItem('predefinedRules');
    if (savedPredefinedRules) {
      document.getElementById('predefinedRules').value = savedPredefinedRules;
    }
  }

  function clearFormData() {
    localStorage.removeItem('inputTextarea');
    localStorage.removeItem('advancedToggle');
    localStorage.removeItem('selectedRules');
    localStorage.removeItem('predefinedRules');
    localStorage.removeItem('configEditor'); 
    localStorage.removeItem('configType');
    localStorage.removeItem('userAgent');
    
    document.getElementById('inputTextarea').value = '';
    document.getElementById('advancedToggle').checked = false;
    document.getElementById('advancedOptions').classList.remove('show');
    document.getElementById('configEditor').value = '';
    document.getElementById('configType').value = 'singbox'; 
    document.getElementById('customUA').value = '';
    
    localStorage.removeItem('customPath');
    document.getElementById('customShortCode').value = '';

    const subscribeLinksContainer = document.getElementById('subscribeLinksContainer');
    subscribeLinksContainer.classList.remove('show');
    subscribeLinksContainer.classList.add('hide');

    document.getElementById('xrayLink').value = '';
    document.getElementById('singboxLink').value = '';
    document.getElementById('clashLink').value = '';

    // wait to reset the container
    setTimeout(() => {
      subscribeLinksContainer.classList.remove('hide');
    }, 500);
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadSavedFormData();
    document.getElementById('encodeForm').addEventListener('submit', submitForm);
    document.getElementById('clearFormBtn').addEventListener('click', clearFormData);
  });
`;

const customRuleFunctions = () => `
  let customRuleCount = 0;
  let currentTab = 'form';

  function switchCustomRulesTab(tab) {
    try {
      currentTab = tab;

      // Update tab buttons
      document.querySelectorAll('.custom-rules-tab').forEach(btn => btn.classList.remove('active'));
      document.getElementById(tab + 'Tab').classList.add('active');

      // Update views
      document.querySelectorAll('.custom-rules-view').forEach(view => view.classList.remove('active'));
      document.getElementById(tab + 'View').classList.add('active');

      // Automatic view conversion
      if (tab === 'json') {
        convertFormToJSON();
      } else {
        convertJSONToForm();
      }

      updateEmptyMessages();
    } catch (error) {
      console.error('Error switching tabs:', error);
      // Ensure the view is correctly displayed if an error occurs during the switch
      document.querySelectorAll('.custom-rules-view').forEach(view => view.classList.remove('active'));
      document.getElementById(tab + 'View').classList.add('active');
    }
  }

  function updateEmptyMessages() {
    const hasFormRules = document.querySelectorAll('.custom-rule').length > 0;
    document.getElementById('emptyFormMessage').style.display = hasFormRules ? 'none' : 'block';
  }

  function addCustomRule() {
    const customRulesDiv = document.getElementById('customRules');
    const newRuleDiv = document.createElement('div');
    newRuleDiv.className = 'custom-rule mb-3 p-3 border rounded';
    newRuleDiv.dataset.ruleId = customRuleCount++;
    newRuleDiv.innerHTML = \`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">${t('customRule')} #\${getNextRuleNumber()}</h6>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeRule(this)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleOutboundName')}</label>
          <input type="text" class="form-control" name="customRuleName[]" placeholder="${t('customRuleOutboundName')}" required>
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleGeoSite')}</label>
          <span class="tooltip-icon">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              ${t('customRuleGeoSiteTooltip')}
            </span>
          </span>
          <input type="text" class="form-control" name="customRuleSite[]" placeholder="${t('customRuleGeoSitePlaceholder')}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleGeoIP')}</label>
          <span class="tooltip-icon">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              ${t('customRuleGeoIPTooltip')}
            </span>
          </span>
          <input type="text" class="form-control" name="customRuleIP[]" placeholder="${t('customRuleGeoIPPlaceholder')}">
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleDomainSuffix')}</label>
          <input type="text" class="form-control" name="customRuleDomainSuffix[]" placeholder="${t('customRuleDomainSuffixPlaceholder')}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleDomainKeyword')}</label>
          <input type="text" class="form-control" name="customRuleDomainKeyword[]" placeholder="${t('customRuleDomainKeywordPlaceholder')}">
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleIPCIDR')}</label>
          <input type="text" class="form-control" name="customRuleIPCIDR[]" placeholder="${t('customRuleIPCIDRPlaceholder')}">
        </div>
      </div>
      <div class="mb-2">
        <label class="form-label">${t('customRuleProtocol')}</label>
        <span class="tooltip-icon">
          <i class="fas fa-question-circle"></i>
          <span class="tooltip-content">
            ${t('customRuleProtocolTooltip')}
          </span>
        </span>
        <input type="text" class="form-control" name="customRuleProtocol[]" placeholder="${t('customRuleProtocolPlaceholder')}">
      </div>
    \`;
    customRulesDiv.appendChild(newRuleDiv);
    updateEmptyMessages();

    // Switch to form tab if not already there
    if (currentTab !== 'form') {
      switchCustomRulesTab('form');
    }
  }

  function clearAllCustomRules() {
    if (confirm('${t('confirmClearAllRules')}')) {
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
      document.querySelectorAll('.custom-rule-json').forEach(rule => rule.remove());
      customRuleCount = 0; 
      updateEmptyMessages();
    }
  }

  // Add a function to get the next rule number
  function getNextRuleNumber() {
    const existingRules = document.querySelectorAll('.custom-rule');
    return existingRules.length + 1;
  }

  // Modify the remove rule function to update the sequence number
  function removeRule(button) {
    const ruleDiv = button.closest('.custom-rule, .custom-rule-json');
    if (ruleDiv) {
      ruleDiv.remove();
      // Update the sequence number of the remaining rules
      document.querySelectorAll('.custom-rule').forEach((rule, index) => {
        const titleElement = rule.querySelector('h6');
        if (titleElement) {
          titleElement.textContent = \`${t('customRule')} #\${index + 1}\`;
        }
      });
      updateEmptyMessages();
    }
  }

  function convertFormToJSON() {
    const formRules = [];
    document.querySelectorAll('.custom-rule').forEach(rule => {
      const ruleData = {
        name: rule.querySelector('input[name="customRuleName[]"]').value || '',
        site: rule.querySelector('input[name="customRuleSite[]"]').value || '',
        ip: rule.querySelector('input[name="customRuleIP[]"]').value || '',
        domain_suffix: rule.querySelector('input[name="customRuleDomainSuffix[]"]').value || '',
        domain_keyword: rule.querySelector('input[name="customRuleDomainKeyword[]"]').value || '',
        ip_cidr: rule.querySelector('input[name="customRuleIPCIDR[]"]').value || '',
        protocol: rule.querySelector('input[name="customRuleProtocol[]"]').value || ''
      };

      // Only add rules that have at least a name
      if (ruleData.name.trim()) {
        formRules.push(ruleData);
      }
    });

    // Update JSON editor content
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea) {
      jsonTextarea.value = JSON.stringify(formRules, null, 2);
      validateJSONRealtime(jsonTextarea);
    }
  }

  function convertJSONToForm() {
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (!jsonTextarea || !jsonTextarea.value.trim()) {
      return;
    }

    try {
      const rules = JSON.parse(jsonTextarea.value.trim());
      if (!Array.isArray(rules)) {
        throw new Error('${t('mustBeArray')}');
      }

      // Clear existing form rules
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());

      // Convert each JSON rule to form
      rules.forEach((ruleData, index) => {
        if (ruleData && ruleData.name) {
          const customRulesDiv = document.getElementById('customRules');
          const newRuleDiv = document.createElement('div');
          newRuleDiv.className = 'custom-rule mb-3 p-3 border rounded';
          newRuleDiv.innerHTML = \`
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">${t('customRule')} #\${index + 1}</h6>
              <button type="button" class="btn btn-danger btn-sm" onclick="removeRule(this)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleOutboundName')}</label>
                <input type="text" class="form-control" name="customRuleName[]" value="\${ruleData.name || ''}" required>
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleGeoSite')}</label>
                <input type="text" class="form-control" name="customRuleSite[]" value="\${ruleData.site || ''}">
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleGeoIP')}</label>
                <input type="text" class="form-control" name="customRuleIP[]" value="\${ruleData.ip || ''}">
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleDomainSuffix')}</label>
                <input type="text" class="form-control" name="customRuleDomainSuffix[]" value="\${ruleData.domain_suffix || ''}">
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleDomainKeyword')}</label>
                <input type="text" class="form-control" name="customRuleDomainKeyword[]" value="\${ruleData.domain_keyword || ''}">
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleIPCIDR')}</label>
                <input type="text" class="form-control" name="customRuleIPCIDR[]" value="\${ruleData.ip_cidr || ''}">
              </div>
            </div>
            <div class="mb-2">
              <label class="form-label">${t('customRuleProtocol')}</label>
              <input type="text" class="form-control" name="customRuleProtocol[]" value="\${ruleData.protocol || ''}">
            </div>
          \`;
          customRulesDiv.appendChild(newRuleDiv);
        }
      });
    } catch (error) {
      console.error('Error converting JSON to form:', error);
      // If an error occurs during the conversion, clear the form view
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
    }

    updateEmptyMessages();
  }

  function validateJSONRealtime(textarea) {
    const messageDiv = textarea.parentNode.querySelector('.json-validation-message');
    const jsonText = textarea.value.trim();
    // Clear previous validation state
    textarea.classList.remove('json-valid', 'json-invalid');
    messageDiv.style.display = 'none';
    messageDiv.classList.remove('valid', 'invalid');
    if (!jsonText) {
      return; // Don't validate empty textarea
    }
    try {
      const rules = JSON.parse(jsonText);
      if (!Array.isArray(rules)) {
        throw new Error('${t('mustBeArray')}');
      }
      const errors = [];
      rules.forEach((ruleData, ruleIndex) => {
        if (!ruleData.name || !ruleData.name.trim()) {
          errors.push(\`${t('rule')} #\${ruleIndex + 1}: ${t('nameRequired')}\`);
        }
      });
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      // Valid JSON
      textarea.classList.add('json-valid');
      messageDiv.textContent = \`✓ ${t('validJSON')} (\${rules.length} ${t('rules')})\`;
      messageDiv.classList.add('valid');
      messageDiv.style.display = 'block';
    } catch (error) {
      // Invalid JSON
      textarea.classList.add('json-invalid');
      messageDiv.textContent = \`✗ \${error.message}\`;
      messageDiv.classList.add('invalid');
      messageDiv.style.display = 'block';
    }
  }

  function validateJSON() {
    let allValid = true;
    let errorMessages = [];
    document.querySelectorAll('.custom-rule-json').forEach((rule, index) => {
      const textarea = rule.querySelector('textarea[name="customRuleJSON[]"]');
      validateJSONRealtime(textarea);
      if (textarea.classList.contains('json-invalid')) {
        allValid = false;
        const messageDiv = textarea.parentNode.querySelector('.json-validation-message');
        errorMessages.push(\`JSON #\${index + 1}: \${messageDiv.textContent.replace('✗ ', '')}\`);
      }
    });
    if (allValid) {
      alert('${t('allJSONValid')}');
    } else {
      alert('${t('jsonValidationErrors')}:\\n\\n' + errorMessages.join('\\n'));
    }
  }

  function parseCustomRules() {
    const customRules = [];

    // Process ordinary form rules
    document.querySelectorAll('.custom-rule').forEach(rule => {
      const ruleData = {
        name: rule.querySelector('input[name="customRuleName[]"]').value || '',
        site: rule.querySelector('input[name="customRuleSite[]"]').value || '',
        ip: rule.querySelector('input[name="customRuleIP[]"]').value || '',
        domain_suffix: rule.querySelector('input[name="customRuleDomainSuffix[]"]').value || '',
        domain_keyword: rule.querySelector('input[name="customRuleDomainKeyword[]"]').value || '',
        ip_cidr: rule.querySelector('input[name="customRuleIPCIDR[]"]').value || '',
        protocol: rule.querySelector('input[name="customRuleProtocol[]"]').value || ''
      };

      if (ruleData.name.trim()) {
        customRules.push(ruleData);
      }
    });

    // Process JSON rules
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea && jsonTextarea.value.trim()) {
      try {
        const jsonRules = JSON.parse(jsonTextarea.value.trim());
        if (Array.isArray(jsonRules)) {
          customRules.push(...jsonRules.filter(r => r.name && r.name.trim()));
        }
      } catch (error) {
        console.error('Error parsing JSON rules:', error);
      }
    }

    return customRules;
  }

  // Initialize interface state
  document.addEventListener('DOMContentLoaded', function() {
    updateEmptyMessages();

    // Initialize real-time validation for JSON textarea
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea && jsonTextarea.value.trim()) {
      validateJSONRealtime(jsonTextarea);
    }

    // Initialize tooltips for dynamically added content
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.querySelectorAll) {
              initTooltips();
            }
          });
        }
      });
    });

    observer.observe(document.getElementById('customRules'), { childList: true, subtree: true });
  });


`;

const generateQRCodeFunction = () => `
  function generateQRCode(id) {
    const input = document.getElementById(id);
    const text = input.value;
    if (!text) {
      alert('No link provided!');
      return;
    }
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.max(2, Math.min(8, Math.floor(300 / moduleCount)));
      const margin = Math.floor(cellSize * 0.5);

      const qrImage = qr.createDataURL(cellSize, margin);
      
      const modal = document.createElement('div');
      modal.className = 'qr-modal';
      modal.innerHTML = \`
        <div class="qr-card">
          <img src="\${qrImage}" alt="QR Code">
          <p>Scan QR Code</p>
        </div>
      \`;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeQRModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeQRModal();
        }
      });

      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    } catch (error) {
      console.error('Error in generating:', error);
      alert('Try to use short links!');
    }
  }

  function closeQRModal() {
    const modal = document.querySelector('.qr-modal');
    if (modal) {
      modal.classList.remove('show');
      modal.addEventListener('transitionend', () => {
        document.body.removeChild(modal);
      }, { once: true });
    }
  }
`;

const saveConfig = () => `
  function saveConfig() {
    const configEditor = document.getElementById('configEditor');
    const configType = document.getElementById('configType').value;
    const config = configEditor.value;

    localStorage.setItem('configEditor', config);
    localStorage.setItem('configType', configType);
    
    fetch('/config?type=' + configType, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: configType,
        content: config
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      return response.text();
    })
    .then(configId => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('configId', configId);
      window.history.pushState({}, '', currentUrl);
      alert('Configuration saved successfully!');
    })
    .catch(error => {
      alert('Error: ' + error.message);
    });
  }
`;

const clearConfig = () => `
  function clearConfig() {
    document.getElementById('configEditor').value = '';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('configId');
    window.history.pushState({}, '', currentUrl);
    localStorage.removeItem('configEditor');
  }
`;

// 配置历史面板
const generateConfigHistoryPanel = () => `
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <i class="fas fa-history me-2"></i>配置历史
      </h5>
      <button class="btn btn-outline-primary btn-sm" onclick="refreshConfigHistory()">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
    <div class="card-body p-0" style="max-height: 600px; overflow-y: auto;">
      <div id="configHistoryList">
        <div class="text-center p-4">
          <i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i>
          <p class="text-muted">加载中...</p>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <small class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        最多保存10条配置记录
      </small>
    </div>
  </div>
`;



// 生成订阅URL
const generateSubscriptionUrlFromConfig = (config) => {
  const baseUrl = window?.location?.origin || 'https://your-domain.workers.dev';
  const pathMap = {
    'clash': '/clash',
    'singbox': '/singbox',
    'surge': '/surge',
    'shadowrocket': '/surge'
  };
  const path = pathMap[config.type] || '/singbox';
  return `${baseUrl}${path}?token=${config.token}`;
};

// 配置历史管理JavaScript函数
const configHistoryFunctions = () => `
  // 页面加载时初始化
  document.addEventListener('DOMContentLoaded', function() {
    loadConfigHistory();
    
    // 绑定保存配置按钮事件
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', saveCurrentConfig);
    }
  });

  // 加载配置历史
  async function loadConfigHistory() {
    try {
      const response = await fetch('/api/configs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const configs = result.success ? result.data : [];
        displayConfigHistory(configs);
      } else {
        console.error('Failed to load config history');
        document.getElementById('configHistoryList').innerHTML = 
          '<div class="text-center p-4"><p class="text-danger">加载配置历史失败</p></div>';
      }
    } catch (error) {
      console.error('Error loading config history:', error);
      document.getElementById('configHistoryList').innerHTML = 
        '<div class="text-center p-4"><p class="text-danger">网络错误</p></div>';
    }
  }

  // 显示配置历史
  function displayConfigHistory(configs) {
    const listContainer = document.getElementById('configHistoryList');
    
    if (!configs || configs.length === 0) {
      listContainer.innerHTML = 
        '<div class="text-center p-4"><p class="text-muted">暂无配置记录</p></div>';
      return;
    }

    const historyHtml = configs.map((config, index) => {
      return generateConfigHistoryItemHtml(config, index);
    }).join('');
    
    listContainer.innerHTML = historyHtml;
  }

  // 生成配置历史项HTML
  function generateConfigHistoryItemHtml(config, index) {
    const subscriptionUrl = generateSubscriptionUrlFromConfigJs(config);
    const isLinkable = config.type === 'clash' || config.type === 'singbox';
    return \`
      <div class="config-history-item p-3 border-bottom" data-config-id="\${config.id}">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <span class="badge bg-primary config-type-badge me-2">\${config.type.toUpperCase()}</span>
              配置 #\${index + 1}
              \${isLinkable ? '<span class="badge bg-success ms-2"><i class="fas fa-link"></i> 支持联动</span>' : ''}
            </h6>
            <p class="mb-1 text-muted small">
              <i class="fas fa-calendar me-1"></i>
              \${new Date(config.created_at).toLocaleString('zh-CN')}
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
                       value="\${subscriptionUrl}" readonly>
                <button class="btn btn-outline-secondary" onclick="copySubscriptionUrlFromHistory(this, event)">
                  <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-outline-primary" onclick="generateQRCodeFromHistory('\${subscriptionUrl}', event)">
                  <i class="fas fa-qrcode"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="config-actions">
            <button class="btn btn-outline-success btn-sm me-1" onclick="loadConfigFromHistory('\${config.id}', event)" title="加载配置">
              <i class="fas fa-download"></i>
            </button>
            \${isLinkable ? \`
            <button class="btn btn-outline-info btn-sm me-1" onclick="syncConfigToLeftPanel('\${config.id}', event)" title="联动到左侧表单">
              <i class="fas fa-link"></i>
            </button>
            \` : ''}
            <button class="btn btn-outline-danger btn-sm" onclick="deleteConfigFromHistory('\${config.id}', event)" title="删除配置">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    \`;
  }

  // 生成订阅URL (JavaScript版本)
  function generateSubscriptionUrlFromConfigJs(config) {
    const baseUrl = window.location.origin;
    const pathMap = {
      'clash': '/clash',
      'singbox': '/singbox',
      'surge': '/surge',
      'shadowrocket': '/surge'
    };
    const path = pathMap[config.type] || '/singbox';
    return \`\${baseUrl}\${path}?token=\${config.token}\`;
  }

  // 保存当前配置
  async function saveCurrentConfig() {
    const formData = new FormData(document.getElementById('encodeForm'));
    const configType = formData.get('target') || 'singbox';
    const subscriptionUrl = formData.get('input');
    
    if (!subscriptionUrl) {
      alert('请先输入订阅链接');
      return;
    }

    // 获取当前配置的所有参数
    const configData = {
      type: configType,
      subscriptionUrl: subscriptionUrl,
      config: formData.get('config') || '',
      customRules: formData.get('customRules') || '',
      selectedRules: Array.from(formData.getAll('selectedRules')),
      shortCode: formData.get('shortCode') || '',
      maxAllowedRules: formData.get('maxAllowedRules') || '10000',
      sortBy: formData.get('sortBy') || 'name',
      includeUnsupportedProxy: formData.has('includeUnsupportedProxy'),
      emoji: formData.has('emoji'),
      udp: formData.has('udp'),
      xudp: formData.has('xudp'),
      tfo: formData.has('tfo'),
      fdn: formData.has('fdn'),
      sort: formData.has('sort'),
      scv: formData.has('scv'),
      fpcdn: formData.has('fpcdn'),
      appendUserinfo: formData.has('appendUserinfo'),
      customToken: formData.get('customToken') || ''
    };

    try {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(configData)
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('配置保存成功！');
        loadConfigHistory(); // 重新加载历史列表
      } else {
        const error = await response.text();
        alert('保存失败: ' + error);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('保存失败: 网络错误');
    }
  }

  // 从历史加载配置
  async function loadConfigFromHistory(configId, event) {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const response = await fetch(\`/api/configs/\${configId}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const config = result.success ? result.data : null;
        if (config) {
          populateFormWithConfig(config);
          
          // 自动触发转换以生成链接
          const form = document.getElementById('encodeForm');
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
          }
        } else {
          alert('配置数据格式错误');
          return;
        }
        alert('配置已加载到表单并已生成订阅链接');
      } else {
        alert('加载配置失败');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      alert('加载失败: 网络错误');
    }
  }

  // 用配置数据填充表单
  function populateFormWithConfig(config) {
    const form = document.getElementById('encodeForm');
    
    // 检查是否支持联动（只有Clash和Sing-box支持）
    const isLinkable = config.type === 'clash' || config.type === 'singbox';
    
    // 首先从配置中获取原始订阅URL
    const subscriptionUrl = config.subscription_url || '';
    document.getElementById('inputTextarea').value = subscriptionUrl;
    
    // 填充配置类型
    const configTypeSelect = document.getElementById('configType');
    if (configTypeSelect) {
      configTypeSelect.value = config.type;
    }
    
    // 填充Token字段（使用配置的永久token）
    const customTokenField = document.getElementById('customToken');
    if (customTokenField) {
      customTokenField.value = config.token || '';
    }
    
    // 解析存储的规则选择
    let selectedRulesArray = [];
    if (config.selected_rules) {
      try {
        selectedRulesArray = JSON.parse(config.selected_rules);
      } catch (e) {
        console.error('解析选择规则失败:', e);
      }
    }
    
    // 清除所有复选框
    const ruleCheckboxes = document.querySelectorAll('.rule-checkbox');
    ruleCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // 设置选中的规则
    if (selectedRulesArray.length > 0) {
      selectedRulesArray.forEach(ruleName => {
        const checkbox = document.getElementById(ruleName);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
      
      // 更新预定义规则选择器
      updatePredefinedRuleSelector(selectedRulesArray);
    }
    
    // 处理自定义规则
    if (config.custom_rules) {
      try {
        const customRules = JSON.parse(config.custom_rules);
        if (customRules.length > 0) {
          // 清除现有自定义规则
          document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
          
          // 切换到JSON视图并填充规则
          switchCustomRulesTab('json');
          const jsonTextarea = document.querySelector('#customRulesJSON textarea');
          if (jsonTextarea) {
            jsonTextarea.value = JSON.stringify(customRules, null, 2);
            validateJSONRealtime(jsonTextarea);
          }
        }
      } catch (e) {
        console.error('解析自定义规则失败:', e);
      }
    }
    
    // 如果支持联动，同步配置内容到UI
    if (isLinkable && config.content) {
      syncConfigToUI(config);
    }
    
    // 显示高级选项
    const advancedToggle = document.getElementById('advancedToggle');
    if (advancedToggle) {
      advancedToggle.checked = true;
      const advancedOptions = document.getElementById('advancedOptions');
      if (advancedOptions) {
        advancedOptions.classList.add('show');
      }
    }
  }

  // 删除配置
  async function deleteConfigFromHistory(configId, event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!confirm('确定要删除这个配置吗？')) {
      return;
    }
    
    try {
      const response = await fetch(\`/api/configs/\${configId}\`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('配置已删除');
        loadConfigHistory(); // 重新加载历史列表
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('删除失败: 网络错误');
    }
  }

  // 复制订阅URL
  function copySubscriptionUrlFromHistory(button, event) {
    if (event) {
      event.stopPropagation();
    }
    
    const input = button.parentElement.querySelector('.subscription-url');
    input.select();
    document.execCommand('copy');
    
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      button.innerHTML = originalIcon;
    }, 2000);
  }

  // 生成二维码
  function generateQRCodeFromHistory(url, event) {
    if (event) {
      event.stopPropagation();
    }
    
    // 使用现有的二维码生成函数
    generateQRCode(url);
  }

  // 刷新配置历史
  function refreshConfigHistory() {
    document.getElementById('configHistoryList').innerHTML = 
      '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x text-muted mb-3"></i><p class="text-muted">加载中...</p></div>';
    loadConfigHistory();
  }

  // 生成随机Token
  function generateRandomToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('customToken').value = token;
  }

  // 同步配置到左侧UI（仅限Clash和Sing-box）
  async function syncConfigToUI(config) {
    try {
      let fullConfig = config.content;
      
      // 处理存储的配置内容
      if (typeof fullConfig === 'string') {
        try {
          fullConfig = JSON.parse(fullConfig);
        } catch (e) {
          console.log('配置不是JSON格式，可能是YAML');
          return;
        }
      }
      
      // 将配置内容同步到配置编辑器
      const configEditor = document.getElementById('configEditor');
      if (configEditor && fullConfig) {
        configEditor.value = JSON.stringify(fullConfig, null, 2);
      }
      
      // 根据配置类型设置左侧表单
      if (config.type === 'clash') {
        document.getElementById('configType').value = 'clash';
        syncClashConfigToUI(fullConfig);
      } else if (config.type === 'singbox') {
        document.getElementById('configType').value = 'singbox';
        syncSingboxConfigToUI(fullConfig);
      }
    } catch (error) {
      console.error('同步配置到UI失败:', error);
    }
  }
  
  function syncClashConfigToUI(clashConfig) {
    try {
      if (clashConfig.rules && Array.isArray(clashConfig.rules)) {
        const extractedRules = extractRulesFromClash(clashConfig.rules);
        updateUIWithExtractedRules(extractedRules);
      }
      if (clashConfig['proxy-groups']) {
        const baseConfig = convertClashToBaseConfig(clashConfig);
        const configEditor = document.getElementById('configEditor');
        if (configEditor) {
          configEditor.value = JSON.stringify(baseConfig, null, 2);
        }
      }
    } catch (error) {
      console.error('同步Clash配置失败:', error);
    }
  }
  
  function syncSingboxConfigToUI(singboxConfig) {
    try {
      if (singboxConfig.route && singboxConfig.route.rules) {
        const extractedRules = extractRulesFromSingbox(singboxConfig.route.rules);
        updateUIWithExtractedRules(extractedRules);
      }
      if (singboxConfig.outbounds) {
        const baseConfig = convertSingboxToBaseConfig(singboxConfig);
        const configEditor = document.getElementById('configEditor');
        if (configEditor) {
          configEditor.value = JSON.stringify(baseConfig, null, 2);
        }
      }
    } catch (error) {
      console.error('同步Sing-box配置失败:', error);
    }
  }
  
  function extractRulesFromClash(rules) {
    const extractedRules = new Set();
    rules.forEach(rule => {
      if (typeof rule === 'string') {
        const parts = rule.split(',');
        if (parts.length >= 3) {
          const ruleType = parts[0];
          if (ruleType === 'GEOSITE' || ruleType === 'DOMAIN-SUFFIX') {
            const ruleName = mapClashRuleToUnified(parts[1]);
            if (ruleName) extractedRules.add(ruleName);
          }
        }
      }
    });
    return Array.from(extractedRules);
  }
  
  function extractRulesFromSingbox(rules) {
    const extractedRules = new Set();
    rules.forEach(rule => {
      if (rule.outbound && rule.outbound !== 'direct' && rule.outbound !== 'block') {
        const ruleName = mapSingboxRuleToUnified(rule);
        if (ruleName) extractedRules.add(ruleName);
      }
    });
    return Array.from(extractedRules);
  }
  
  function mapClashRuleToUnified(ruleValue) {
    const mappings = {
      'google': 'Google', 'youtube': 'Youtube', 'telegram': 'Telegram',
      'github': 'Github', 'microsoft': 'Microsoft', 'apple': 'Apple', 'bilibili': 'Bilibili'
    };
    for (const [key, value] of Object.entries(mappings)) {
      if (ruleValue.toLowerCase().includes(key)) return value;
    }
    return null;
  }
  
  function mapSingboxRuleToUnified(rule) {
    const mappings = { 
      'google': 'Google', 'youtube': 'Youtube', 'telegram': 'Telegram',
      'github': 'Github', 'microsoft': 'Microsoft', 'apple': 'Apple', 'bilibili': 'Bilibili' 
    };
    
    if (rule.geosite) {
      const geosite = Array.isArray(rule.geosite) ? rule.geosite : [rule.geosite];
      for (const site of geosite) {
        for (const [key, value] of Object.entries(mappings)) {
          if (site.includes(key)) return value;
        }
      }
    }
    
    if (rule.domain_suffix) {
      const domains = Array.isArray(rule.domain_suffix) ? rule.domain_suffix : [rule.domain_suffix];
      for (const domain of domains) {
        for (const [key, value] of Object.entries(mappings)) {
          if (domain.includes(key)) return value;
        }
      }
    }
    return null;
  }
  
  function updateUIWithExtractedRules(extractedRules) {
    const ruleCheckboxes = document.querySelectorAll('.rule-checkbox');
    ruleCheckboxes.forEach(checkbox => checkbox.checked = false);
    extractedRules.forEach(ruleName => {
      const checkbox = document.getElementById(ruleName);
      if (checkbox) checkbox.checked = true;
    });
    updatePredefinedRuleSelector(extractedRules);
  }
  
  function updatePredefinedRuleSelector(selectedRules) {
    const predefinedSelect = document.getElementById('predefinedRules');
    if (!predefinedSelect) return;
    
    const predefinedRuleSets = {
      'minimal': ['Node Select', 'Ad Block', 'Private', 'Location:CN'],
      'balanced': ['Node Select', 'Ad Block', 'Google', 'Youtube', 'Telegram', 'Private', 'Location:CN'],
      'comprehensive': ['Node Select', 'Ad Block', 'AI Services', 'Bilibili', 'Youtube', 'Google', 'Private', 'Location:CN', 'Telegram', 'Github', 'Microsoft', 'Apple', 'Social Media', 'Streaming']
    };
    
    for (const [setName, rules] of Object.entries(predefinedRuleSets)) {
      if (arraysEqual(selectedRules.sort(), rules.sort())) {
        predefinedSelect.value = setName;
        return;
      }
    }
    predefinedSelect.value = 'custom';
  }
  
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  
  function convertClashToBaseConfig(clashConfig) {
    return { 
      'proxy-groups': clashConfig['proxy-groups'] || [], 
      'rules': clashConfig.rules || [] 
    };
  }
  
  function convertSingboxToBaseConfig(singboxConfig) {
    return { 
      'outbounds': singboxConfig.outbounds || [], 
      'route': singboxConfig.route || {} 
    };
  }

  // 切换分享链接显示
  function toggleShareLinks(configId, event) {
    if (event) event.stopPropagation();
    
    const container = document.getElementById(\`shareLinks-\${configId}\`);
    const button = event.target.closest('button');
    
    if (!container) return;
    
    if (container.style.display === 'none') {
      container.style.display = 'block';
      button.innerHTML = '<i class="fas fa-eye-slash me-1"></i>隐藏分享链接';
      generateShareLinksForConfig(configId);
    } else {
      container.style.display = 'none';
      button.innerHTML = '<i class="fas fa-share-alt me-1"></i>显示分享链接';
    }
  }

  // 为配置生成分享链接
  async function generateShareLinksForConfig(configId) {
    try {
      const container = document.getElementById(\`shareLinks-\${configId}\`);
      if (!container) return;
      
      const linksContainer = container.querySelector('.share-links-container');
      linksContainer.innerHTML = '<div class="text-center p-2"><i class="fas fa-spinner fa-spin"></i> 生成中...</div>';
      
      // 获取配置详情
      const response = await fetch(\`/api/configs/\${configId}\`);
      if (!response.ok) {
        throw new Error('获取配置失败');
      }
      
      const result = await response.json();
      const config = result.data;
      
      // 解析配置内容获取节点
      const nodes = await extractNodesFromConfig(config);
      
      if (!nodes || nodes.length === 0) {
        linksContainer.innerHTML = '<div class="alert alert-warning small p-2 mb-0">未找到可用节点</div>';
        return;
      }
      
      // 调用生成分享链接API
      const shareResponse = await fetch('/api/configs/generate-share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });
      
      if (shareResponse.ok) {
        const shareResult = await shareResponse.json();
        displayShareLinks(configId, shareResult.shareLinks);
      } else {
        throw new Error('生成分享链接失败');
      }
    } catch (error) {
      console.error('生成分享链接失败:', error);
      const container = document.getElementById(\`shareLinks-\${configId}\`);
      if (container) {
        const linksContainer = container.querySelector('.share-links-container');
        linksContainer.innerHTML = \`<div class="alert alert-danger small p-2 mb-0">生成失败: \${error.message}</div>\`;
      }
    }
  }

  // 显示分享链接
  function displayShareLinks(configId, shareLinks) {
    const container = document.getElementById(\`shareLinks-\${configId}\`);
    if (!container) return;
    
    const linksContainer = container.querySelector('.share-links-container');
    
    if (!shareLinks || shareLinks.length === 0) {
      linksContainer.innerHTML = '<div class="alert alert-warning small p-2 mb-0">未生成任何分享链接</div>';
      return;
    }
    
    const linksHtml = shareLinks.map(link => {
      if (link.error) {
        return \`<div class="alert alert-warning small p-1 mb-1">\${link.name}: \${link.error}</div>\`;
      }
      return \`
        <div class="input-group input-group-sm mb-1">
          <span class="input-group-text" style="min-width: 60px;">\${link.type.toUpperCase()}</span>
          <input type="text" class="form-control" value="\${link.uri}" readonly title="\${link.name}">
          <button class="btn btn-outline-secondary" onclick="copyShareLink(this, event)" title="复制链接">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      \`;
    }).join('');
    
    linksContainer.innerHTML = linksHtml;
  }

  // 从配置中提取节点
  async function extractNodesFromConfig(config) {
    try {
      let configContent = config.content;
      
      // 如果content是字符串，尝试解析为JSON
      if (typeof configContent === 'string') {
        try {
          configContent = JSON.parse(configContent);
        } catch (e) {
          console.log('配置不是JSON格式，可能是YAML或其他格式');
          return [];
        }
      }
      
      const nodes = [];
      
      if (config.type === 'clash') {
        // 从Clash配置中提取节点
        if (configContent.proxies && Array.isArray(configContent.proxies)) {
          configContent.proxies.forEach(proxy => {
            if (proxy.type && proxy.name && proxy.server && proxy.port) {
              nodes.push({
                name: proxy.name,
                type: proxy.type,
                server: proxy.server,
                port: proxy.port,
                ...proxy // 包含所有其他属性
              });
            }
          });
        }
      } else if (config.type === 'singbox') {
        // 从Sing-box配置中提取节点
        if (configContent.outbounds && Array.isArray(configContent.outbounds)) {
          configContent.outbounds.forEach(outbound => {
            if (outbound.type && outbound.tag && outbound.server && outbound.server_port) {
              nodes.push({
                name: outbound.tag,
                type: outbound.type,
                server: outbound.server,
                port: outbound.server_port,
                ...outbound // 包含所有其他属性
              });
            }
          });
        }
      }
      
      return nodes;
    } catch (error) {
      console.error('提取节点失败:', error);
      return [];
    }
  }

  // 复制分享链接
  function copyShareLink(button, event) {
    if (event) event.stopPropagation();
    
    const input = button.parentElement.querySelector('input');
    input.select();
    document.execCommand('copy');
    
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      button.innerHTML = originalIcon;
    }, 2000);
  }

  // 将配置同步到左侧面板
  async function syncConfigToLeftPanel(configId, event) {
    if (event) event.stopPropagation();
    
    try {
      const response = await fetch(\`/api/configs/\${configId}\`);
      if (response.ok) {
        const result = await response.json();
        const config = result.success ? result.data : null;
        if (config) {
          // 仅同步配置内容，不自动转换
          populateFormWithConfig(config);
          
          // 高亮显示已同步
          const button = event.target.closest('button');
          const originalContent = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i>';
          button.classList.remove('btn-outline-info');
          button.classList.add('btn-success');
          
          setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-info');
          }, 2000);
          
          // 可选：滚动到表单顶部
          document.getElementById('encodeForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (error) {
      console.error('同步配置失败:', error);
      alert('同步配置失败: ' + error.message);
    }
  }
`;
