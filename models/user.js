var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  B = require("bluebird");

var UserSchema = new Schema({
  uid: String,
  name: String,
  totalVisits: Number,
  totalPurchases: Number,
  lastVisitTime: Date,
  timeOfLastPurchase: Date,
  sessions: []
});

var Model = mongoose.model('User', UserSchema);
B.promisifyAll(Model);
B.promisifyAll(Model.prototype);
module.exports = Model;