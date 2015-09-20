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
      return null;
    }
    return res.send(doc);
  });
};

exports.findAll = function(req, res){
  return res.send('none found');
};

exports.update = function(req, res){
  console.log(req.body);
  return res.send('got somethig to eat');
};
