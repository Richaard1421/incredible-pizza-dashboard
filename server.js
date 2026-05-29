const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_HOST = '189.206.185.197';
const API_PORT = 33001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function proxyPost(req, res) {
  const apiPath = req.path.replace('/api', '');
  const bodyStr = JSON.stringify(req.body);
  console.log('→ POST ' + apiPath);

  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: apiPath,
    method: 'POST',
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  const proxyReq = https.request(options, function(proxyRes) {
    let data = '';
    proxyRes.on('data', function(chunk) { data += chunk; });
    proxyRes.on('end', function() {
      console.log('← ' + proxyRes.statusCode + ' ' + apiPath);
      res.status(proxyRes.statusCode).set('Content-Type', 'application/json').send(data);
    });
  });

  proxyReq.on('error', function(err) {
    console.error('Error:', err.message);
    res.status(502).json({ error: 'No se pudo conectar a Sacoa', detail: err.message });
  });

  proxyReq.write(bodyStr);
  proxyReq.end();
}

app.post('/api/login', proxyPost);
app.post('/api/roaming/getActivity', proxyPost);
app.post('/api/roaming/getIdByDate', proxyPost);
app.post('/api/games/getActivity', proxyPost);
app.post('/api/games/getIdByDate', proxyPost);
app.post('/api/games/list', proxyPost);
app.post('/api/games/listDetailed', proxyPost);
app.post('/api/games/getCategoriesNames', proxyPost);
app.post('/api/reports/redemption/itemsRedeemed', proxyPost);
app.post('/api/reports/games/all', proxyPost);
app.post('/api/reports/sales/all', proxyPost);
app.post('/api/reports/sales/totals', proxyPost);

app.post('/api/dcsReports/gamesActivity', proxyPost);
app.post('/api/dcsReports/gamesActivityByGroup', proxyPost);
app.post('/api/dcsReports/sales', proxyPost);
app.post('/api/dcsReports/salesDetails', proxyPost);

app.get('/sheets/:sheetId', function(req, res) {
  var sheetId = req.params.sheetId;
  var sheetName = req.query.sheet || '';
  var url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=' + encodeURIComponent(sheetName);
  
  var https2 = require('https');
  https2.get(url, function(proxyRes) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    var data = '';
    proxyRes.on('data', function(chunk) { data += chunk; });
    proxyRes.on('end', function() {
      res.set('Content-Type', 'application/json');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(data);
    });
  }).on('error', function(err) {
    res.status(502).json({ error: err.message });
  });
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('✅ Servidor corriendo en http://localhost:' + PORT);
  console.log('📡 Proxy → https://' + API_HOST + ':' + API_PORT);
});