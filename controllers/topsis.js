
exports.getTopsis = function(req, res){
  Musician.find({},function(err, results) {
    return res.send(results);
  });
};
