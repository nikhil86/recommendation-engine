var express = require('express');
var app = express();
require('./routes')(app);

app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){

});

console.log('Recommendation engine is up');
