exports.findById = function(req, res){
  var id = req.params.id;
  return res.send(id);
};

exports.findAll = function(req, res){
  return res.send('none found');
};
