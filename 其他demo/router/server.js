const http = require('http');
const fs = require('fs');
const path = require('path');

// 支持的文件类型
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 路由映射配置
const routeMap = {
    // Vue Router 演示
    '/history-mode': 'history-mode.html',
    '/hash-mode': 'hash-mode.html',
    
    // 原生JS实现演示
    '/history-mode-vanilla': 'history-mode-vanilla.html',
    '/hash-mode-vanilla': 'hash-mode-vanilla.html',
    
    // History模式下的路由路径
    '/home': 'history-mode-vanilla.html',
    '/about': 'history-mode-vanilla.html',
    '/contact': 'history-mode-vanilla.html'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`请求: ${req.url}`);
    
    // 解析URL，获取路径名
    let filePath = req.url;
    
    // 如果是根路径，返回index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // 检查是否是前端路由路径
    const routePath = Object.keys(routeMap).find(route => 
        filePath === route || filePath.startsWith(`${route}/`));
    
    if (routePath && !filePath.includes('.')) {
        filePath = `/${routeMap[routePath]}`;
    }
    
    // 获取完整的文件路径
    const fullPath = path.join(__dirname, filePath);
    
    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // 默认的内容类型
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 尝试读取文件
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            // 如果文件不存在，并且路径不包含点（可能是前端路由路径）
            if (err.code === 'ENOENT') {
                // 尝试返回index.html
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('404 Not Found');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
                return;
            }
            
            // 其他错误
            res.writeHead(500);
            res.end(`服务器错误: ${err.code}`);
            return;
        }
        
        // 成功读取文件
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    });
});

// 设置端口
const PORT = process.env.PORT || 3000;

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('提示：');
    console.log('1. 访问 http://localhost:3000 查看演示首页');
    console.log('2. Vue Router 演示:');
    console.log('   - http://localhost:3000/hash-mode.html (Hash模式)');
    console.log('   - http://localhost:3000/history-mode.html (History模式)');
    console.log('3. 原生JS实现演示:');
    console.log('   - http://localhost:3000/hash-mode-vanilla.html (Hash模式)');
    console.log('   - http://localhost:3000/history-mode-vanilla.html (History模式)');
    console.log('4. 在History模式下，尝试刷新页面，服务器会正确处理路由');
});