exports.findById = function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-Version');
  var id = req.params.id;
  return res.send(id);
};

exports.findAll = function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-Version');
  return res.send('none found');
};
