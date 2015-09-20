var mongoose = require('mongoose'),
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
    return res.send(doc);
  });
};

exports.findAll = function(req, res){
  return res.send('none found');
};

exports.update = function(req, res){
  console.log(req.body);
  console.log(req.params.id);
  var id = req.params.id;
  User.findOneAndUpdate({
    uid: id
  }, {
        $push: {
          "searchHistory": req.body
        }
  }, {
    new: true,
    upsert: true
  }, function (err, doc) {
    if(err) {
      console.log(err);
      return res.send(err);
    }
    return res.send(doc);
  });
};
