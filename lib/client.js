window.Spyhook = function() {
  this.supports_cors = false;
  this._host = 'http://localhost:1337';
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

  this.host = function(host) {
    this._host = host;
  };

  this.send_requests = function(callback, async) {
    if (typeof(async) == 'undefined') { async = true; }

    // TODO: semaphore around this
    var jsoned_requests = JSON.stringify(this._requests);
    this._requests = [];

    // This sucks. We have to do this because browsers now fire off an OPTIONS request, which _is_ synchronous, but then the POST afterwards is not.
    if (!this.supports_cors) {
      var iframe = document.createElement("iframe");
      var uniqueString = "spyhook";
      document.body.appendChild(iframe);
      iframe.style.display = "none";
      iframe.contentWindow.name = uniqueString;

      var form = document.createElement("form");
      form.target = uniqueString;
      form.action = this._host + '/spy';
      form.method = "POST";

      // repeat for each parameter
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "body";
      input.value = jsoned_requests;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      if (!async) {
        var tick = 0;
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        while(doc.readyState != 'complete' && tick < 500) { tick++; }
      }
    } else {
      xhr_req = new xhr();
      xhr_req.onreadystatechange = function() {
        if (xhr_req.readyState > 1) { // 2 == we've got response headers, but haven't read response body. Honeybadger on the resp. body.
          if (typeof(callback) != 'undefined') { callback(); }
        }
      };
      xhr_req.open("POST",this._host + "/spy",async);
      xhr_req.setRequestHeader('Content-Type', 'application/json');
      xhr_req.send(jsoned_requests + "\n\n");
    }
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
        if (typeof(this.oldbeforeunload) == 'function') {
          this.oldbeforeunload();
        }
      }, false);
    }
  };

  this._request_timeout = setTimeout(this.send_requests_tick, 2000);

  return this;
}();
