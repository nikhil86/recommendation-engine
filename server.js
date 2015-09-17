var express = require('express'),
	app = express(),
	mongoose = require('mongoose');

var mongoUri = process.env.MONGOLAB_URI;
mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoUri);
});


var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'example.com');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

app.use(allowCrossDomain);

require('./models/musician');
require('./models/users');
require('./routes')(app);

app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});

console.log('Recommendation engine is up ');
