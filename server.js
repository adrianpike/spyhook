var CONFIG = require('config');

if (CONFIG.ssl) {
  var path     = require("path");
  var fs       = require("fs");
  var http     = require('https');

  var credentials;
  var keysPath = __dirname + "/keys";
  if (path.existsSync(keysPath + "/privatekey.pem") && path.existsSync(keysPath + "/certificate.pem")) {
    var privateKey = fs.readFileSync(keysPath + "/privatekey.pem", "utf8");
    var certificate = fs.readFileSync(keysPath + "/certificate.pem", "utf8");
    var ca = fs.readFileSync(keysPath + "/ca.pem", "utf8");

    credentials = {key: privateKey, cert: certificate, ca: ca};
  }
}

var express = require("express");
var Lactate = require('lactate');
var Spyhook = require('./lib/server.js').spyhook({});

var lactate = Lactate.Lactate();
lactate.set({
  root:process.cwd(),
  expires:'1 day'
});

var app = express();
app.use(express.bodyParser());

auth = express.basicAuth(CONFIG.username, CONFIG.password);

app.get('/spyhook.js', function(req, res) {
  lactate.serve('lib/client.js', req, res);
});

app.options('/spy', function(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type'});
  res.end('{success: true}\n');
});

app.post('/spy', function(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type'});

  if (req.headers['content-type'] == 'application/x-www-form-urlencoded') {
    req.body = JSON.parse(req.body.body);
  }

  for (var idx in req.body) {
    var event = req.body[idx];
    Spyhook.record(event.event, event.opts);
  }
  res.end('{success: true}\n');

});

app.get('/test', function(req, res) {
  lactate.serve('static/test.html', req, res);
});


app.get('/', function(req, res) {
  lactate.serve('static/index.html', req, res);
});

app.get('/reports', auth, function(req, res) {
  lactate.serve('static/reports.html', req, res);
});

app.get('/events', auth, function(req, res) {
  Spyhook.events(function(result) {
    res.send(result);
  });
});

app.get('/events/:event', auth, function(req, res) {
  Spyhook.event(req.params['event'], function(item) {
    res.send(item);
  });
});

app.get('/keys/', auth, function(req, res) {
  // TODO
});

app.get('/keys/:key/:value', auth, function(req, res) {
  // TODO
});

app.get('/event-stream.json', auth, function(req, res) {
  res.header('Content-Type', 'text/event-stream');
  res.header('Cache-Control', 'no-cache');
  res.header('Connection', 'keep-alive');

  tailers.push(res);

  res.on('close', function() {
    tailers.splice(tailers.indexOf(res), 1);
  });

});

console.log('Spyhook receiver running at http://127.0.0.1:' + CONFIG.port + '/');

if (credentials) {
  https = http.createServer(credentials, app);
  https.listen(CONFIG.port);
} else {
  app.listen(CONFIG.port);
}
