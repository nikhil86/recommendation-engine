var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  uid: String,
  name: String,
  searchHistory: []
});

mongoose.model('User', UserSchema);