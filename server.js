var express = require('express'),
	app = express(),
	mongoose = require('mongoose');

var mongoUri = process.env.MONGOLAB_URI;
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoUri);
});

require('./models/musician');
require('./models/users');
require('./routes')(app);

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-Version');

  if (!req.body) {
    req.body = {};
  }

  next();
});

app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});

console.log('Recommendation engine is up ');
