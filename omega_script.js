var request = require('request');
var fs = require('fs');

var ThetaControl = {
  //The options for accessing the API don't change
  uri: "http://192.168.1.1/osc/commands/execute",
  connect : function(callback) {
    var options = {
      uri: this.uri,
      method: 'POST',
      json: {
        "name": "camera.startSession",
        "parameters": {}
      }
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        console.log(body.name);
        self.session_id = body.results.sessionId;
        self.setVersion(callback);
      }
      else {
        console.log("Force the API version");
        self.setVersion(callback);
      }
    });
  },
  setVersion : function(callback) {
    var options = {
      uri: this.uri,
      method: 'POST',
      json: {
        "name": "camera.setOptions",
        "parameters": {
          "sessionId" : this.session_id,
          "options" : {
            "clientVersion" : 2
          }
        }
      }
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        callback();
      }
    });
  },
  getState : function(callback) {
    var options = {
      uri: 'http://192.168.1.1/osc/state',
      method: 'POST'
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        var jState = JSON.parse(body);
        self.stateFingerprint = jState.fingerprint;
        callback(body);
      }
    });
  },
  takePicture: function(callback) {
    var options = {
      uri: this.uri,
      method: 'POST',
      json: {
        "name": "camera.takePicture",
      }
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        callback(body);
      }
    });
  },
  checkForUpdate: function(callback) {
    var options = {
      uri: 'http://192.168.1.1/osc/checkForUpdates',
      method: 'POST',
      json: {
        "stateFingerprint": this.stateFingerprint
      }
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        callback(body);
      }
      else {
        console.log(body);
      }
    });
  },
  deleteFile : function(fileUri, callback) {
    var options = {
      uri: this.uri,
      method: 'POST',
      json: {
        "name": "camera.delete",
        "parameters" : {
          fileUrls: [ fileUri ]
        }
      }
    };
    var self = this;
    request(options, function(error, response, body) {
      if(!error && response.statusCode == 200) {
        callback(body);
      }
    });
  }
};

/*
 * Connect sets the API to 2 on the Theta, so we need to get the state and pass that into the takePhoto Command
 */
var onConnect = function() {
  ThetaControl.getState(takePhoto);
}

/*
 * We know what the last state of the photo is, time to actually take the photo
 */
var takePhoto = function(state) {
  setInterval(10000, ThetaControl.takePicture(done));
}

var done = function(body)
{
  console.log('Photo taken');
}

//This kicks the whole thing off!
ThetaControl.connect(onConnect);
