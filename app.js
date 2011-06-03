
/**
 * Module dependencies.
 */

var express = require('express')
  , util = require('util')
  , boot = require('./lib/bootstrap')
  , fs = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'momma loves mambo' }));
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// TODO: create real portable db

// bootstrap
var canonical_db = boot.canonical_db();

var gadgets = new boot.SampleGadget();
  
// Route middleware

function loadGadget(req, res, next){
  var content = {}
    , requiredFeatures = []
    , features = [];

  content = gadgets['Content'][req.params.id]['#'];
  requiredFeatures = gadgets['ModulePrefs']['Require'];
  
  // Parse features
  // TODO: Add dependancy injection
  if (content) {
    req.content = content;
    
    if (requiredFeatures) {
      for(i in requiredFeatures){
        var file = dir = requiredFeatures[i]['@']['feature'];
        
        features[i] = "/javascripts/features/" + dir + "/" + file + ".js";
      }
      req.features = features;
    }
    
    next();
  } else {
    next(new Error('Failed to load gadget ' + req.params.id + "\'s content"));
  } 
}

// Routes

app.get('/', function(req, res){
  res.render('index');
});

app.get('/gadgets/:id', loadGadget, function(req, res){
  res.render('gadget', {content : req.content, features : req.features})
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}

// NowJS component

var everyone = require("now").initialize(app);

var foo = 'bar';

everyone.now.getFoo = function(callback){
  callback(foo);
}

everyone.now.getPerson = function(callback){
  var person = canonical_db['people'];
  callback(person);
}