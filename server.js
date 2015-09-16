var express = require('express'),
	app = express(),
	mongoose = require('mongoose'),
require('./routes')(app);

var mongoUri = process.env.MONGOLAB_URI;
mongoose.connect(mongoUri);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});

console.log('Recommendation engine is up ' + process.env.PORT + ', ' + process.env.IP);
