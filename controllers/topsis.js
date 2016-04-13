
var Topsis = require('../models/topsis'),
  User = require('../models/user'),
  _ = require('underscore'),
  L = require('../logger'),
  B = require("bluebird");

exports.sort = function(req, res){
  L.info();
  L.info('Running Topsis Algorithm :: sort()');
  L.info();
  var body = req.body;
  var id = req.params.id;
  return User.findOneAsync({
    uid: id
  }).then(function (user) {
    if (!user) {
      L.error('Topsis Controller :: Sort() -> Unable to find user with id ' + id);
      return res.send('Unable to find user');
    }
    return new B(function (resolve, reject) {
      if (!_.isEmpty(body.pref)) {
        user.preference = body.pref;
        user.saveAsync().then(function () {
          L.info('User updated with Preference');
          return resolve();
        })
      } else if (!_.isEmpty(user.preference)) {
        body.pref = user.preference;
        return resolve();
      } else {
        var searchData;
        if(_.isEmpty(body.searchCriteria)) {
          searchData = user.getLastSearch();
        } else {
          searchData = body.searchCriteria;
        }

        if(null === searchData) {
          return reject("Unable to retreive Last Search Data");
        }
          console.log("-------------");
        console.log(searchData)
          console.log("---------------");
        body.pref = User.getPreference(searchData);
        return resolve();
      }
    }).then(function () {
        var parsedPref = Topsis.parsePrefs(body.pref);
        var parsedFlights = Topsis.parseFlights(body.flights);
        var data = Topsis.scoreItins(parsedPref, parsedFlights);
        var resData = {
          'preferences': body.pref,
          'parsedFlights' : data
        };
        resData.increasePrice = 0;
        L.warn("");L.warn("");

        var countSimilarSearch;
        if(_.isEmpty(body.searchCriteria)) {
          countSimilarSearch = user.countSimilarSearches();
        } else {
          countSimilarSearch = user.countSimilarSearches(body.searchCriteria);
        }

        L.warn("Number of times the user has searched for this exact product = " + countSimilarSearch);
        if(countSimilarSearch > 2) {
          resData.increasePrice = user.getPriceIncrementPercentage(body.isMobile);
          L.warn ("The price will be increased by " + resData.increasePrice + " %");
        }
        L.warn("");L.warn("");
        return  res.send(resData);
      })
  }).catch(function(e) {
    L.error("Topsis :: sort() -> Error from here " + e);
  });;
};
