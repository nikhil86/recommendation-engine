var express = require('express'),
  https = require('https'),
  fs = require('fs'),
	app = express(),
  bodyParser  = require("body-parser"),
	mongoose = require('mongoose'),
  L = require("./logger");;

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017';
//var mongoUri = process.env.MONGOLAB_URI || 'mongodb://heroku_jlkph440:5egmvqi1lq42rj3jea099ck4kq@ds027799.mongolab.com:27799/heroku_jlkph440';

mongoose.connect(mongoUri);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoUri);
});
app.set("jsonp callback", true);

var privateKey  = fs.readFileSync('ssl/server.key', 'utf8');
var certificate = fs.readFileSync('ssl/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

app.use(bodyParser.json({ extended: true, parameterLimit: 10000, limit: 1024 * 1024 * 10 }));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 10000, limit: 1024 * 1024 * 10 }));
app.use(allowCrossDomain);

require('./models/user');
require('./models/topsis');
require('./routes')(app);

app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});


app.set('port', process.env.PORT || '3000');
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(process.env.PORT || '3000');
//app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

//});

console.log('Recommendation engine is up and listening on port number: ' + 3000);
