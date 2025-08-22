// 用户认证处理模块
import { generateToken, verifyToken } from '../utils.js';

export class AuthHandler {
    constructor() {
        this.loginPath = '/login';
        this.logoutPath = '/logout';
        this.adminPath = '/admin';
    }

    // 检查是否需要认证
    isProtectedPath(pathname) {
        // 登录和登出页面不需要认证
        const publicPaths = ['/login', '/logout'];
        if (publicPaths.includes(pathname)) {
            return false;
        }
        
        // 订阅生成路径使用token验证，不需要登录认证
        const subscriptionPaths = ['/singbox', '/clash', '/surge'];
        if (subscriptionPaths.some(path => pathname.startsWith(path))) {
            return false;
        }
        
        // 其他所有路径都需要认证
        return true;
    }

    // 验证用户身份
    async verifyAuth(request) {
        const cookies = this.parseCookies(request.headers.get('Cookie') || '');
        const sessionToken = cookies['session_token'];
        
        if (!sessionToken) {
            return false;
        }

        try {
            const decoded = verifyToken(sessionToken);
            return decoded && decoded.username;
        } catch (error) {
            return false;
        }
    }

    // 处理登录请求
    async handleLogin(request, env) {
        if (request.method === 'GET') {
            return this.generateLoginPage();
        }

        if (request.method === 'POST') {
            return this.processLogin(request, env);
        }

        return new Response('Method not allowed', { status: 405 });
    }

    // 生成登录页面
    generateLoginPage(error = '') {
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sublink Worker - 用户登录</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h2 {
            color: #333;
            margin-bottom: 10px;
        }
        .btn-login {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .error-alert {
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h2>Sublink Worker</h2>
            <p class="text-muted">请登录以继续</p>
        </div>
        
        ${error ? `<div class="alert alert-danger error-alert">${error}</div>` : ''}
        
        <form method="POST" action="/login">
            <div class="mb-3">
                <label for="username" class="form-label">用户名</label>
                <input type="text" class="form-control" id="username" name="username" required>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">密码</label>
                <input type="password" class="form-control" id="password" name="password" required>
            </div>
            <button type="submit" class="btn btn-login">登录</button>
        </form>
    </div>
</body>
</html>`;
        
        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 处理登录逻辑
    async processLogin(request, env) {
        try {
            const formData = await request.formData();
            const username = formData.get('username');
            const password = formData.get('password');

            // 从环境变量获取用户凭据
            const adminUser = env.ADMIN_USER || 'admin';
            const adminPassword = env.ADMIN_PASSWORD;
            
            if (!adminPassword) {
                return this.generateLoginPage('系统未配置管理员密码，请联系管理员');
            }
            
            if (username !== adminUser || password !== adminPassword) {
                return this.generateLoginPage('用户名或密码错误');
            }

            // 生成session token
            const sessionToken = generateToken({ username });
            
            // 设置cookie并重定向
            return new Response('', {
                status: 302,
                headers: {
                    'Location': '/',
                    'Set-Cookie': `session_token=${sessionToken}; HttpOnly; Path=/; Max-Age=86400` // 24小时有效期
                }
            });

        } catch (error) {
            return this.generateLoginPage('登录处理出错，请重试');
        }
    }

    // 处理登出
    handleLogout() {
        return new Response('', {
            status: 302,
            headers: {
                'Location': '/login',
                'Set-Cookie': 'session_token=; HttpOnly; Path=/; Max-Age=0'
            }
        });
    }

    // 解析cookies
    parseCookies(cookieHeader) {
        const cookies = {};
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
        return cookies;
    }

    // 生成未授权响应
    generateUnauthorizedResponse() {
        return new Response('', {
            status: 302,
            headers: {
                'Location': '/login'
            }
        });
    }
}
