window.Spyhook = function() {
  this._globals = {
    keys: {},
    data: {}
  };
  this._requests = [];
  this._request_timeout = null;

  if (typeof XMLHttpRequest == "undefined") {
    this.xhr = function () { // LOL ms.
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
      catch (e) {}
    };
  } else {
    this.xhr = XMLHttpRequest;
  }

  this.globals = function(new_globals) {
    new_globals.keys = new_globals.keys || {};
    new_globals.data = new_globals.data || {};
    for (var key in new_globals.keys) { this._globals.keys[key] = new_globals.keys[key]; }
    for (var key in new_globals.data) { this._globals.data[key] = new_globals.data[key]; }
  };

  this.send_requests = function(callback, synchronous) {
    var sync = synchronous || true;

    // TODO: semaphore around this
    var jsoned_requests = JSON.stringify(this._requests);
    this._requests = [];

    xhr_req = new xhr();
    xhr_req.onreadystatechange = function() {
      if (xhr_req.readyState > 1) { // 2 == we've got response headers, but haven't read response body. Honeybadger on the resp. body.
        if (typeof(callback) != 'undefined') { callback(); }
      }
    };
    xhr_req.open("POST","/spy",sync);
    xhr_req.setRequestHeader('Content-Type', 'application/json');
    xhr_req.send(jsoned_requests + "\n\n");
  };

  this.send_requests_tick = function() {
    if (this._requests.length > 0) {
      this.send_requests(function() { setTimeout(window.Spyhook.send_requests_tick, 5000); });
    } else {
      this._request_timeout = setTimeout(window.Spyhook.send_requests_tick, 5000);
    }
  };

  this.record = function(event, opts) {
    opts = opts || {};
    opts.keys = opts.keys || {};
    opts.data = opts.data || {};
    for (var key in this._globals.keys) { opts.keys[key] = this._globals.keys[key]; }
    for (var key in this._globals.data) { opts.data[key] = this._globals.data[key]; }

    var date = new Date();
    opts.keys.timestamp = date.toJSON();

    // TODO: potentially thread unsafe - need to investigate this.
    this._requests.push({
      event: event,
      opts: opts});
  };

  window.onload = function() {
    this.record('visit', { keys: { url: document.location.href } });
  };

  this.oldbeforeunload = window.onbeforeunload;
  window.onbeforeunload = function() {
    if (this._requests.length > 0) {
      this.send_requests(function() {
        this.oldbeforeunload();
      }, false);
    }
  };

  this._request_timeout = setTimeout(this.send_requests_tick, 5000);

  return this;
}();
