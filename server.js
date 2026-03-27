const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;

function fetchYahoo(symbol, period1, period2) {
return new Promise((resolve, reject) => {
const path = `/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
const options = {
hostname: 'query1.finance.yahoo.com',
path,
method: 'GET',
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
'Accept': 'application/json',
'Referer': 'https://finance.yahoo.com',
'Origin': 'https://finance.yahoo.com',
}
};
const req = https.request(options, res => {
let data = '';
res.on('data', chunk => data += chunk);
res.on('end', () => {
try { resolve(JSON.parse(data)); }
catch(e) { reject(new Error('Invalid JSON from Yahoo')); }
});
});
req.on('error', reject);
req.end();
});
}

const server = http.createServer(async (req, res) => {
// CORS headers — allow any origin
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

const parsed = url.parse(req.url, true);

// Health check
if (parsed.pathname === '/') {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('RSI Proxy OK');
return;
}

// /stock?symbol=TCS.NS&period1=…&period2=…
if (parsed.pathname === '/stock') {
const { symbol, period1, period2 } = parsed.query;
if (!symbol) {
res.writeHead(400, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ error: 'symbol param required' }));
return;
}
try {
const data = await fetchYahoo(symbol, period1 || 0, period2 || Math.floor(Date.now()/1000));
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify(data));
} catch(e) {
res.writeHead(500, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ error: e.message }));
}
return;
}

res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log(`RSI proxy running on port ${PORT}`));