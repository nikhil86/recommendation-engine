var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  uid: String,
  name: String,
  arrivalDate: String,
  departureDate: String,
  arrivalAirport: String,
  departureAirport: String,
  journeyType: String
});

mongoose.model('User', UserSchema);