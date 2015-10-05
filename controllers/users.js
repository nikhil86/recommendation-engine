var mongoose = require('mongoose'),
  _ = require('underscore'),
  User = mongoose.model('User');

exports.findById = function(req, res){
  var id = req.params.id;
  User.findOneAndUpdate({
    uid: id
  }, {}, {
    new: true,
    upsert: true
  }, function (err, doc) {
    if(err) {
      console.log(err);
      return res.send(err);
    }
    var data = {};
    if(doc.searchHistory && doc.searchHistory.length > 0) {
      data = doc.searchHistory[doc.searchHistory.length - 1];
    }
    res.header('Content-type','application/json');
    res.header('Charset','utf8');
    var callback = req.query.callback || 'callback';

    return res.send(callback + '(' + JSON.stringify(data) + ')');
  });
};

exports.findAll = function(req, res){
  return res.send('none found');
};

exports.update = function(req, res){
  console.log(req.body);
  console.log(req.params.id);
  var id = req.params.id;
  var body = req.body;
  return User.findOneAsync({
    uid: id
  })
  .then(function (user) {
    console.log(user);
    if(!user) {
      user = new User({
        uid: id
      });
    }
    if(body.isNew) {
      user.session[_.keys(user.session).length + 1] = [body];
    } else {
      user.session[_.keys(user.session).length].push(body);
    }
    user.totalVisits++;
    user.lastVisitTime = new Date();
    console.log(user);
    return user.saveAsync()
    .then(function (data) {
        console.log('Done saving user', data);
        return res.send(data);
    });
  });
};
