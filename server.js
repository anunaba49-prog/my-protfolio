const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;
const hostname = '127.0.0.1';

const server = http.createServer((req, res) => {
    let filePath = req.url;
    
    // Default to index.html if root is requested
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    const fullPath = path.join(process.cwd(), filePath);
    const extname = path.extname(fullPath).slice(1);
    
    // Set content type based on file extension
    const contentType = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'text/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
    }[extname] || 'application/octet-stream';
    
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log('Press Ctrl+C to stop the server');
});