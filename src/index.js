import { SingboxConfigBuilder } from './SingboxConfigBuilder.js';
import { generateHtml } from './htmlBuilder.js';
import { generateAdminHtml } from './adminHtmlBuilder.js';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';
import { SurgeConfigBuilder } from './SurgeConfigBuilder.js';
import { decodeBase64, encodeBase64, GenerateWebPath } from './utils.js';
import { PREDEFINED_RULE_SETS } from './config.js';
import { t, setLanguage } from './i18n/index.js';
import { AuthHandler } from './handlers/auth.js';
import { ConfigManager } from './handlers/configManagerD1.js';
import yaml from 'js-yaml';

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};

async function handleRequest(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    setLanguage(lang || request.headers.get('accept-language')?.split(',')[0]);
    
    // 初始化处理器
    const authHandler = new AuthHandler();
    const configManager = new ConfigManager(env);
    
    // 处理登录相关路径
    if (url.pathname === '/login') {
      return authHandler.handleLogin(request, env);
    }
    
    if (url.pathname === '/logout') {
      return authHandler.handleLogout();
    }
    
    // 检查是否需要认证（保护路径）
    if (authHandler.isProtectedPath(url.pathname)) {
      const isAuthenticated = await authHandler.verifyAuth(request);
      if (!isAuthenticated) {
        return authHandler.generateUnauthorizedResponse();
      }
    }
    
    // 主页面路由
    if (request.method === 'GET' && url.pathname === '/') {
      // 检查是否已登录，显示相应页面
      const isAuthenticated = await authHandler.verifyAuth(request);
      if (isAuthenticated) {
        return new Response(generateHtml('', '', '', '', url.origin), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } else {
        return authHandler.generateUnauthorizedResponse();
      }
    }
    
    // 管理面板路由
    if (request.method === 'GET' && url.pathname === '/admin') {
      // 获取配置列表和统计信息
      const configList = await configManager.getConfigList();
      const stats = await configManager.getConfigStats();
      return new Response(generateAdminHtml(configList.data, stats), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // API路由处理
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, configManager);
    }
    
    // 现有的配置生成路由（支持token验证）
    // 修改第75-95行的验证逻辑
    else if (url.pathname.startsWith('/singbox') || url.pathname.startsWith('/clash') || url.pathname.startsWith('/surge') || url.pathname.startsWith('/xray')) {
      const token = url.searchParams.get('token');
      let inputString = url.searchParams.get('config');
      let selectedRules = url.searchParams.get('selectedRules');
      let customRules = url.searchParams.get('customRules');
      
      if (!token) {
      return new Response(t('missingToken'), { status: 400 });
      }
      
      // 首先检查是否是存储的配置token
      const storedConfig = await configManager.getConfigByToken(token);
      if (token && storedConfig) {
      return generateSubscriptionResponse(storedConfig, url.pathname);
      }
      
      // 然后检查是否是有效的临时token
      const tempTokenValue = await env.TEMP_TOKENS.get(`temp_${token}`);
      if (!tempTokenValue) {
      return new Response(t('invalidToken'), { status: 400 });
      }
       
      // 获取语言参数，如果为空则使用默认值
      let lang = url.searchParams.get('lang') || 'zh-CN';
      // Get custom UserAgent
      let userAgent = url.searchParams.get('ua');
      if (!userAgent) {
        userAgent = 'curl/7.74.0';
      }

      if (!inputString) {
        return new Response(t('missingConfig'), { status: 400 });
      }

      if (PREDEFINED_RULE_SETS[selectedRules]) {
        selectedRules = PREDEFINED_RULE_SETS[selectedRules];
      } else {
        try {
          selectedRules = JSON.parse(decodeURIComponent(selectedRules));
        } catch (error) {
          console.error('Error parsing selectedRules:', error);
          selectedRules = PREDEFINED_RULE_SETS.minimal;
        }
      }

      // Deal with custom rules
      try {
        customRules = JSON.parse(decodeURIComponent(customRules));
      } catch (error) {
        console.error('Error parsing customRules:', error);
        customRules = [];
      }

      // Modify the existing conversion logic
      const configId = url.searchParams.get('configId');
      let baseConfig;
      if (configId) {
        const customConfig = await env.SUBLINK_FULL_KV.get(configId);
        if (customConfig) {
          baseConfig = JSON.parse(customConfig);
        }
      }

      let configBuilder;
      if (url.pathname.startsWith('/singbox')) {
        configBuilder = new SingboxConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent);
      } else if (url.pathname.startsWith('/clash')) {
        configBuilder = new ClashConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent);
      } else {
        configBuilder = new SurgeConfigBuilder(inputString, selectedRules, customRules, baseConfig, lang, userAgent)
          .setSubscriptionUrl(url.href);
      }

      const config = await configBuilder.build();

      // 设置正确的 Content-Type 和其他响应头
      const headers = {
        'content-type': url.pathname.startsWith('/singbox')
          ? 'application/json; charset=utf-8'
          : url.pathname.startsWith('/clash')
            ? 'text/yaml; charset=utf-8'
            : 'text/plain; charset=utf-8'
      };

      // 如果是 Surge 配置，添加 subscription-userinfo 头
      if (url.pathname.startsWith('/surge')) {
        headers['subscription-userinfo'] = 'upload=0; download=0; total=10737418240; expire=2546249531';
      }

      return new Response(
        url.pathname.startsWith('/singbox') ? JSON.stringify(config, null, 2) : config,
        { headers }
      );

    } else if (url.pathname === '/shorten') {
      const originalUrl = url.searchParams.get('url');
      if (!originalUrl) {
        return new Response(t('missingUrl'), { status: 400 });
      }

      const shortCode = GenerateWebPath();
      await env.SUBLINK_FULL_KV.put(shortCode, originalUrl);

      const shortUrl = `${url.origin}/s/${shortCode}`;
      return new Response(JSON.stringify({ shortUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (url.pathname === '/shorten-v2') {
      const originalUrl = url.searchParams.get('url');
      let shortCode = url.searchParams.get('shortCode');

      if (!originalUrl) {
        return new Response('Missing URL parameter', { status: 400 });
      }

      // Create a URL object to correctly parse the original URL
      const parsedUrl = new URL(originalUrl);
      const queryString = parsedUrl.search;

      if (!shortCode) {
        shortCode = GenerateWebPath();
      }

      await env.SUBLINK_FULL_KV.put(shortCode, queryString);

      return new Response(shortCode, {
        headers: { 'Content-Type': 'text/plain' }
      });

    } else if (url.pathname.startsWith('/b/') || url.pathname.startsWith('/c/') || url.pathname.startsWith('/x/') || url.pathname.startsWith('/s/')) {
      const shortCode = url.pathname.split('/')[2];
      const originalParam = await env.SUBLINK_FULL_KV.get(shortCode);
      let originalUrl;

      if (url.pathname.startsWith('/b/')) {
        originalUrl = `${url.origin}/singbox${originalParam}`;
      } else if (url.pathname.startsWith('/c/')) {
        originalUrl = `${url.origin}/clash${originalParam}`;
      } else if (url.pathname.startsWith('/x/')) {
        originalUrl = `${url.origin}/xray${originalParam}`;
      } else if (url.pathname.startsWith('/s/')) {
        originalUrl = `${url.origin}/surge${originalParam}`;
      }

      if (originalUrl === null) {
        return new Response(t('shortUrlNotFound'), { status: 404 });
      }

      return Response.redirect(originalUrl, 302);
    } else if (url.pathname.startsWith('/xray')) {
      // Handle Xray config requests
      const inputString = url.searchParams.get('config');
      const proxylist = inputString.split('\n');

      const finalProxyList = [];
      // Use custom UserAgent (for Xray) Hmmm...
      let userAgent = url.searchParams.get('ua');
      if (!userAgent) {
        userAgent = 'curl/7.74.0';
      }
      let headers = new Headers({
        "User-Agent"   : userAgent
      });

      for (const proxy of proxylist) {
        if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
          try {
            const response = await fetch(proxy, {
              method : 'GET',
              headers : headers
            })
            const text = await response.text();
            let decodedText;
            decodedText = decodeBase64(text.trim());
            // Check if the decoded text needs URL decoding
            if (decodedText.includes('%')) {
              decodedText = decodeURIComponent(decodedText);
            }
            finalProxyList.push(...decodedText.split('\n'));
          } catch (e) {
            console.warn('Failed to fetch the proxy:', e);
          }
        } else {
          finalProxyList.push(proxy);
        }
      }

      const finalString = finalProxyList.join('\n');

      if (!finalString) {
        return new Response('Missing config parameter', { status: 400 });
      }

      return new Response(encodeBase64(finalString), {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    } else if (url.pathname === '/favicon.ico') {
      return Response.redirect('https://cravatar.cn/avatar/9240d78bbea4cf05fb04f2b86f22b18d?s=160&d=retro&r=g', 301)
    } else if (url.pathname === '/config') {
      const { type, content } = await request.json();
      const configId = `${type}_${GenerateWebPath(8)}`;

      try {
        let configString;
        if (type === 'clash') {
          // 如果是 YAML 格式，先转换为 JSON
          if (typeof content === 'string' && (content.trim().startsWith('-') || content.includes(':'))) {
            const yamlConfig = yaml.load(content);
            configString = JSON.stringify(yamlConfig);
          } else {
            configString = typeof content === 'object'
              ? JSON.stringify(content)
              : content;
          }
        } else {
          // singbox 配置处理
          configString = typeof content === 'object'
            ? JSON.stringify(content)
            : content;
        }

        // 验证 JSON 格式
        JSON.parse(configString);

        await env.SUBLINK_FULL_KV.put(configId, configString, {
          expirationTtl: 60 * 60 * 24 * 30  // 30 days
        });

        return new Response(configId, {
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (error) {
        console.error('Config validation error:', error);
        return new Response(t('invalidFormat') + error.message, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    } else if (url.pathname === '/resolve') {
      const shortUrl = url.searchParams.get('url');
      if (!shortUrl) {
        return new Response(t('missingUrl'), { status: 400 });
      }

      try {
        const urlObj = new URL(shortUrl);
        const pathParts = urlObj.pathname.split('/');
        
        if (pathParts.length < 3) {
          return new Response(t('invalidShortUrl'), { status: 400 });
        }

        const prefix = pathParts[1]; // b, c, x, s
        const shortCode = pathParts[2];

        if (!['b', 'c', 'x', 's'].includes(prefix)) {
          return new Response(t('invalidShortUrl'), { status: 400 });
        }

        const originalParam = await env.SUBLINK_FULL_KV.get(shortCode);
        if (originalParam === null) {
          return new Response(t('shortUrlNotFound'), { status: 404 });
        }

        let originalUrl;
        if (prefix === 'b') {
          originalUrl = `${url.origin}/singbox${originalParam}`;
        } else if (prefix === 'c') {
          originalUrl = `${url.origin}/clash${originalParam}`;
        } else if (prefix === 'x') {
          originalUrl = `${url.origin}/xray${originalParam}`;
        } else if (prefix === 's') {
          originalUrl = `${url.origin}/surge${originalParam}`;
        }

        return new Response(JSON.stringify({ originalUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(t('invalidShortUrl'), { status: 400 });
      }
    }

    return new Response(t('notFound'), { status: 404 });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(t('internalError'), { status: 500 });
  }
}

// API请求处理
async function handleApiRequest(request, configManager) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // 获取配置列表
    if (path === '/api/configs' && request.method === 'GET') {
      const configList = await configManager.getConfigList();
      const stats = await configManager.getConfigStats();
      return new Response(JSON.stringify({
        success: true,
        data: configList,
        stats
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建新配置
    if (path === '/api/configs' && request.method === 'POST') {
      const requestData = await request.json();
      const { 
        type, 
        subscriptionUrl, 
        config, 
        customRules, 
        selectedRules, 
        customToken,
        shortCode,
        maxAllowedRules,
        sortBy,
        includeUnsupportedProxy,
        emoji,
        udp,
        xudp,
        tfo,
        fdn,
        sort,
        scv,
        fpcdn,
        appendUserinfo
      } = requestData;

      if (!type || !subscriptionUrl) {
        return new Response(JSON.stringify({
          success: false,
          error: '缺少必要参数: type 和 subscriptionUrl'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        // 获取节点数据
        const nodes = await fetchNodesFromUrl(subscriptionUrl);
        
        // 保存配置数据
        const configData = {
          type,
          subscriptionUrl,
          config: config || '',
          customRules: customRules || '',
          selectedRules: selectedRules || [],
          shortCode: shortCode || '',
          maxAllowedRules: maxAllowedRules || '10000',
          sortBy: sortBy || 'name',
          includeUnsupportedProxy: !!includeUnsupportedProxy,
          emoji: !!emoji,
          udp: !!udp,
          xudp: !!xudp,
          tfo: !!tfo,
          fdn: !!fdn,
          sort: !!sort,
          scv: !!scv,
          fpcdn: !!fpcdn,
          appendUserinfo: !!appendUserinfo
        };
        
        // 保存配置
        const result = await configManager.saveConfig(type, JSON.stringify(configData), nodes, customToken);
        
        return new Response(JSON.stringify({
          success: true,
          data: result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取单个配置详情
    if (path.startsWith('/api/configs/') && request.method === 'GET') {
      const configId = path.split('/')[3];
      const configData = await configManager.getConfig(configId);
      
      if (!configData) {
        return new Response(JSON.stringify({
          success: false,
          error: '配置不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: configData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 删除配置
    if (path.startsWith('/api/configs/') && request.method === 'DELETE') {
      const configId = path.split('/')[3];
      const result = await configManager.deleteConfig(configId);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新配置节点
    if (path.startsWith('/api/configs/') && path.endsWith('/nodes') && request.method === 'POST') {
      const configId = path.split('/')[3];
      const requestData = await request.json();
      const { nodes } = requestData;
      
      const result = await configManager.updateConfigNodes(configId, nodes);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'API endpoint not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 从URL获取节点数据
async function fetchNodesFromUrls(urls, userAgent = 'curl/7.74.0') {
  const allNodes = [];
  const headers = new Headers({ "User-Agent": userAgent });
  
  for (const url of urls) {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const response = await fetch(url, { method: 'GET', headers });
        const text = await response.text();
        let decodedText = decodeBase64(text.trim());
        
        if (decodedText.includes('%')) {
          decodedText = decodeURIComponent(decodedText);
        }
        
        const nodeUrls = decodedText.split('\n').filter(line => line.trim());
        
        // 使用ProxyParser解析节点
        const { ProxyParser } = await import('./ProxyParsers.js');
        for (const nodeUrl of nodeUrls) {
          try {
            const parsedNode = await ProxyParser.parse(nodeUrl, userAgent);
            if (parsedNode && parsedNode.tag) {
              allNodes.push(parsedNode);
            }
          } catch (parseError) {
            console.warn('Failed to parse node:', nodeUrl, parseError);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from URL:', url, error);
    }
  }
  
  return allNodes;
}

// 生成基础配置
function generateBaseConfig(type, selectedRules = []) {
  if (type === 'clash') {
    return {
      'port': 7890,
      'socks-port': 7891,
      'allow-lan': false,
      'mode': 'rule',
      'log-level': 'info',
      'dns': {
        'enable': true,
        'enhanced-mode': 'fake-ip',
        'nameserver': ['1.1.1.1', '8.8.8.8']
      },
      'proxies': [],
      'proxy-groups': [],
      'rules': []
    };
  } else if (type === 'singbox') {
    return {
      'dns': {
        'servers': [
          {
            'tag': 'dns_proxy',
            'address': 'tcp://1.1.1.1',
            'strategy': 'ipv4_only'
          }
        ]
      },
      'inbounds': [
        { 'type': 'mixed', 'tag': 'mixed-in', 'listen': '0.0.0.0', 'listen_port': 2080 }
      ],
      'outbounds': [
        { 'type': 'direct', 'tag': 'DIRECT' },
        { 'type': 'block', 'tag': 'REJECT' }
      ],
      'route': {
        'rules': [],
        'rule_set': []
      }
    };
  }
  
  return {};
}

// 生成订阅响应
async function generateSubscriptionResponse(configData, pathname) {
  try {
    let content;
    
    if (pathname.startsWith('/clash')) {
      if (typeof configData.content === 'object') {
        content = yaml.dump(configData.content);
      } else {
        content = configData.content;
      }
      
      return new Response(content, {
        headers: {
          'content-type': 'text/yaml; charset=utf-8',
          'subscription-userinfo': 'upload=0; download=0; total=10737418240; expire=2546249531'
        }
      });
    } else if (pathname.startsWith('/singbox')) {
      content = typeof configData.content === 'object' 
        ? JSON.stringify(configData.content, null, 2)
        : configData.content;
        
      return new Response(content, {
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      });
    } else if (pathname.startsWith('/surge')) {
      // Surge格式处理
      content = typeof configData.content === 'string' 
        ? configData.content 
        : generateSurgeConfig(configData);
        
      return new Response(content, {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'subscription-userinfo': 'upload=0; download=0; total=10737418240; expire=2546249531'
        }
      });
    }
    
    return new Response('Unsupported format', { status: 400 });
    
  } catch (error) {
    console.error('Generate subscription response error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// 生成Surge配置（简化版）
function generateSurgeConfig(configData) {
  const nodes = configData.nodes || [];
  const proxies = nodes.map(node => {
    if (node.type === 'shadowsocks') {
      return `${node.tag} = ss, ${node.server}, ${node.server_port}, encrypt-method=${node.method}, password=${node.password}`;
    }
    // 可以根据需要添加更多类型
    return `${node.tag} = direct`;
  }).join('\n');
  
  return `[General]
skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local
dns-server = system, 1.1.1.1, 8.8.8.8

[Proxy]
${proxies}

[Proxy Group]
🚀 节点选择 = select, ${nodes.map(n => n.tag).join(', ')}

[Rule]
DOMAIN-SUFFIX,cn,DIRECT
GEOIP,CN,DIRECT
FINAL,🚀 节点选择`;
}

// 从单个订阅URL获取节点数据
async function fetchNodesFromUrl(subscriptionUrl) {
  try {
    // 检查是否是单个节点URL（vmess://, vless://, ss://, trojan://, hy2://等）
    if (subscriptionUrl.match(/^(vmess|vless|ss|trojan|ssr|hy2|hysteria2):\/\//)) {
      // 直接解析单个节点
      const node = parseProxyFromUri(subscriptionUrl);
      return node ? [node] : [];
    }
    
    // 处理HTTP/HTTPS订阅链接
    const response = await fetch(subscriptionUrl, {
      headers: {
        'User-Agent': 'ClashForAndroid/2.5.12'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }
    
    const content = await response.text();
    const nodes = [];
    
    // 解析base64编码的内容
    let decodedContent;
    try {
      decodedContent = decodeBase64(content);
    } catch {
      // 如果不是base64编码，直接使用原内容
      decodedContent = content;
    }
    
    // 解析节点
    const lines = decodedContent.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const node = parseProxyFromUri(line.trim());
      if (node) {
        nodes.push(node);
      }
    }
    
    return nodes;
  } catch (error) {
    console.error('Error fetching nodes from URL:', error);
    throw error;
  }
}

// 解析代理URI为节点对象
function parseProxyFromUri(uri) {
  try {
    if (uri.startsWith('ss://')) {
      return parseShadowsocks(uri);
    } else if (uri.startsWith('vmess://')) {
      return parseVmess(uri);
    } else if (uri.startsWith('vless://')) {
      return parseVless(uri);
    } else if (uri.startsWith('trojan://')) {
      return parseTrojan(uri);
    } else if (uri.startsWith('hy2://') || uri.startsWith('hysteria2://')) {
      return parseHysteria2(uri);
    }
    return null;
  } catch (error) {
    console.error('Error parsing proxy URI:', error);
    return null;
  }
}

// 解析Shadowsocks节点
function parseShadowsocks(uri) {
  const url = new URL(uri);
  const userInfo = url.username ? decodeBase64(url.username) : '';
  const [method, password] = userInfo.includes(':') ? userInfo.split(':') : ['', ''];
  
  return {
    type: 'shadowsocks',
    tag: decodeURIComponent(url.hash?.substring(1) || ''),
    server: url.hostname,
    server_port: parseInt(url.port) || 443,
    method: method,
    password: password
  };
}

// 解析VMess节点
function parseVmess(uri) {
  try {
    const data = JSON.parse(decodeBase64(uri.substring(8)));
    return {
      type: 'vmess',
      tag: data.ps || '',
      server: data.add,
      server_port: parseInt(data.port) || 443,
      uuid: data.id,
      security: data.scy || 'auto',
      alter_id: parseInt(data.aid) || 0
    };
  } catch (error) {
    console.error('Error parsing VMess:', error);
    return null;
  }
}

// 解析VLESS节点
function parseVless(uri) {
  const url = new URL(uri);
  return {
    type: 'vless',
    tag: decodeURIComponent(url.hash?.substring(1) || ''),
    server: url.hostname,
    server_port: parseInt(url.port) || 443,
    uuid: url.username,
    flow: url.searchParams.get('flow') || '',
    encryption: url.searchParams.get('encryption') || 'none'
  };
}

// 解析Trojan节点
function parseTrojan(uri) {
  const url = new URL(uri);
  return {
    type: 'trojan',
    tag: decodeURIComponent(url.hash?.substring(1) || ''),
    server: url.hostname,
    server_port: parseInt(url.port) || 443,
    password: url.username
  };
}

// 解析Hysteria2节点
function parseHysteria2(uri) {
  const url = new URL(uri);
  return {
    type: 'hysteria2',
    tag: decodeURIComponent(url.hash?.substring(1) || ''),
    server: url.hostname,
    server_port: parseInt(url.port) || 443,
    password: url.username,
    up_mbps: parseInt(url.searchParams.get('upmbps')) || 10,
    down_mbps: parseInt(url.searchParams.get('downmbps')) || 50
  };
}

// 在handleApiRequest函数中添加
if (url.pathname === '/api/store-temp-token' && request.method === 'POST') {
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: '缺少token参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 存储到KV，设置1小时过期
    await env.TEMP_TOKENS.put(`temp_${token}`, 'valid', { expirationTtl: 3600 });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}