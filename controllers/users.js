exports.findById = function(req, res){
  var id = req.params.id;
  return res.send(id);
};