
(function() {
  function injectScript(src) {
    var js = document.createElement('script');
    js.src = src;
    document.getElementsByTagName('head')[0].appendChild(js);
  }
  
  // We create the bare minimum R here, with stubs for things that can be
  // called before the real initialization, as well as client-specific
  // configuration data. Then we load the real implementation script, 
  // which gets cached, minimized, versioned, etc, like normal. 
  var originalR = window.R;
  var originalRdio = window.rdio;
  window.R = window.rdio = window.__rdio = {
    _config: {
      client_id: "O6AaGOhuj-J9rKck49gQMw",
      helper: "helper.html",
      iframe: "https://www.rdio.com/api/iframe/?client_id=O6AaGOhuj-J9rKck49gQMw", 
      oauth2: "https://www.rdio.com/oauth2/authorize/",
      oauth2Auto: "https://www.rdio.com/oauth2/authorize/auto/",
      logout: "https://www.rdio.com/oauth2/logout/?client_id=O6AaGOhuj-J9rKck49gQMw",
      baseUrl: "http://www.rdio.com/",
      insideRdio: false,
      originalR: originalR,
      originalRdio: originalRdio,
      earlyReadies: [],
      earlySubscriptions: [], 
      earlyAccessToken: null
    },
    
    ready: function() {
      this._config.earlyReadies.push(arguments);
      return false;
    },
    
    on: function() {
      this._config.earlySubscriptions.push(arguments);
      return this;
    },
    
    accessToken: function(value) {
      if (value === undefined) {
        return this._config.earlyAccessToken;
      }
      this._config.earlyAccessToken = value;
    },
    
    authenticated: function() {
      // At this stage in the startup sequence, we're neither authenticated or not authenticated,
      // so this function returns undefined.
    }, 

    insideRdio: function() {
      return this._config.insideRdio;
    },
    
    noConflict: function(both) {
      window.R = this._config.originalR;
      if (both) {
        window.rdio = this._config.originalRdio;
      }
      return this;
    }
  };
  
  R.bind = R.on;

  injectScript("http://www.rdio.com/media/api/api-impl.847249fd8ce685946c6d990ec8404cff.js");
})();