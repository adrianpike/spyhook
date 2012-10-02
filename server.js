var express = require("express");
var app = express();
app.use(express.bodyParser());

var Lactate = require('lactate');
var lactate = Lactate.Lactate();

var Spyhook = require('./lib/server.js').spyhook();

var tailers = [];

lactate.set({
  root:process.cwd(),
  expires:'5 minutes'
});

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

  for (var tailer in tailers) { // TODO: make this not suck
    var id = (new Date()).toLocaleTimeString();
    tailers[tailer].write('id: ' + id + '\n');
    tailers[tailer].write('event: event\n');
    tailers[tailer].write('data: ' + JSON.stringify(req.body) + '\n\n');
  }

});

app.get('/tail', function(req, res) {
  lactate.serve('static/tail.html', req, res);
});

app.get('/events.json', function(req, res) {
  res.header('Content-Type', 'text/event-stream');
  res.header('Cache-Control', 'no-cache');
  res.header('Connection', 'keep-alive');

  tailers.push(res);

  res.on('close', function() {
    tailers.splice(tailers.indexOf(res), 1);
  });

});

app.get('/test', function(req, res) {
  lactate.serve('static/test.html', req, res);
});

console.log('Server running at http://127.0.0.1:1337/');
console.log(Spyhook);

app.listen(1337);
