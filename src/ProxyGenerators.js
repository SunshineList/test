class ProxyGenerator {
  static generateUri(node) {
    switch (node.type?.toLowerCase()) {
      case 'vmess':
        return VmessGenerator.generate(node);
      case 'vless':
        return VlessGenerator.generate(node);
      case 'shadowsocks':
      case 'ss':
        return ShadowsocksGenerator.generate(node);
      case 'trojan':
        return TrojanGenerator.generate(node);
      case 'hysteria2':
      case 'hy2':
        return Hysteria2Generator.generate(node);
      case 'tuic':
        return TuicGenerator.generate(node);
      default:
        throw new Error(`Unsupported proxy type: ${node.type}`);
    }
  }
}

class VmessGenerator {
  static generate(node) {
    const config = {
      v: '2',
      ps: node.name || '',
      add: node.server || '',
      port: node.port || 443,
      id: node.uuid || '',
      aid: node.alterId || 0,
      scy: node.cipher || 'auto',
      net: node.network || 'tcp',
      type: node.type || 'none',
      host: node.host || '',
      path: node.path || '',
      tls: node.tls ? 'tls' : '',
      sni: node.sni || '',
      alpn: node.alpn || '',
      fp: node.fingerprint || ''
    };
    
    // 移除空值
    Object.keys(config).forEach(key => {
      if (config[key] === '' || config[key] === 0 && key !== 'port') {
        delete config[key];
      }
    });
    
    const encoded = btoa(JSON.stringify(config));
    return `vmess://${encoded}`;
  }
}

class VlessGenerator {
  static generate(node) {
    const params = new URLSearchParams();
    
    if (node.encryption) params.set('encryption', node.encryption);
    if (node.security) params.set('security', node.security);
    if (node.sni) params.set('sni', node.sni);
    if (node.alpn) params.set('alpn', node.alpn);
    if (node.fingerprint) params.set('fp', node.fingerprint);
    if (node.type) params.set('type', node.type);
    if (node.host) params.set('host', node.host);
    if (node.path) params.set('path', node.path);
    if (node.serviceName) params.set('serviceName', node.serviceName);
    if (node.mode) params.set('mode', node.mode);
    
    const queryString = params.toString();
    const fragment = encodeURIComponent(node.name || '');
    
    return `vless://${node.uuid}@${node.server}:${node.port}${queryString ? '?' + queryString : ''}${fragment ? '#' + fragment : ''}`;
  }
}

class ShadowsocksGenerator {
  static generate(node) {
    const method = node.cipher || node.method || 'aes-256-gcm';
    const password = node.password || '';
    const server = node.server || '';
    const port = node.port || 443;
    const name = node.name || '';
    
    // 编码用户信息部分
    const userInfo = btoa(`${method}:${password}`);
    
    // 构建URL
    let url = `ss://${userInfo}@${server}:${port}`;
    
    // 添加插件参数
    const params = new URLSearchParams();
    if (node.plugin) {
      params.set('plugin', node.plugin);
      if (node.pluginOpts) {
        params.set('plugin-opts', node.pluginOpts);
      }
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    // 添加名称片段
    if (name) {
      url += '#' + encodeURIComponent(name);
    }
    
    return url;
  }
}

class TrojanGenerator {
  static generate(node) {
    const params = new URLSearchParams();
    
    if (node.security) params.set('security', node.security);
    if (node.sni) params.set('sni', node.sni);
    if (node.alpn) params.set('alpn', node.alpn);
    if (node.fingerprint) params.set('fp', node.fingerprint);
    if (node.type) params.set('type', node.type);
    if (node.host) params.set('host', node.host);
    if (node.path) params.set('path', node.path);
    if (node.serviceName) params.set('serviceName', node.serviceName);
    
    const queryString = params.toString();
    const fragment = encodeURIComponent(node.name || '');
    
    return `trojan://${node.password}@${node.server}:${node.port}${queryString ? '?' + queryString : ''}${fragment ? '#' + fragment : ''}`;
  }
}

class Hysteria2Generator {
  static generate(node) {
    const params = new URLSearchParams();
    
    if (node.auth) params.set('auth', node.auth);
    if (node.sni) params.set('sni', node.sni);
    if (node.insecure) params.set('insecure', '1');
    if (node.obfs) params.set('obfs', node.obfs);
    if (node.obfsPassword) params.set('obfs-password', node.obfsPassword);
    
    const queryString = params.toString();
    const fragment = encodeURIComponent(node.name || '');
    
    return `hysteria2://${node.password}@${node.server}:${node.port}${queryString ? '?' + queryString : ''}${fragment ? '#' + fragment : ''}`;
  }
}

class TuicGenerator {
  static generate(node) {
    const params = new URLSearchParams();
    
    if (node.uuid) params.set('uuid', node.uuid);
    if (node.password) params.set('password', node.password);
    if (node.sni) params.set('sni', node.sni);
    if (node.insecure) params.set('insecure', '1');
    if (node.alpn) params.set('alpn', node.alpn);
    if (node.congestionControl) params.set('congestion_control', node.congestionControl);
    if (node.udpRelayMode) params.set('udp_relay_mode', node.udpRelayMode);
    
    const queryString = params.toString();
    const fragment = encodeURIComponent(node.name || '');
    
    return `tuic://${node.server}:${node.port}${queryString ? '?' + queryString : ''}${fragment ? '#' + fragment : ''}`;
  }
}

export {
  ProxyGenerator,
  VmessGenerator,
  VlessGenerator,
  ShadowsocksGenerator,
  TrojanGenerator,
  Hysteria2Generator,
  TuicGenerator
};