exports.findAll = function(req, res){
  res.send([{
    "id": 1,
    "name": "Max",
    "band": "Maximum Pain",
    "instrument": "guitar"
  }]);
};