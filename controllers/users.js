var mongoose = require('mongoose'),
  _ = require('underscore'),
  User = mongoose.model('User'),
  L = require('../logger');

exports.findById = function(req, res){
  var id = req.params.id;
  return User.findOneAsync({
    uid: id
  }).then(function (user) {
    if(!user) {
      user = new User({
        uid: id
      });
    }

    return user.saveAsync().then(function (doc) {
      res.header('Content-type','application/json');
      res.header('Charset','utf8');
      var dataToSend = user.toBriefJSON();
      var callback = req.query.callback || 'callback';
      res.jsonp(dataToSend);
    })
  });
};

exports.getAncillaries = function (req, res) {
  var id = req.params.id;
  return User.findOneAsync({
    uid: id
  }).then(function (user) {
    var ancillaries = user.getAncillaries();
    var callback = req.query.callback || 'callback';
    res.jsonp(ancillaries);
  });
};

exports.findAll = function(req, res){
  return res.send('none found');
};

exports.update = function(req, res){
  var id = req.params.id;
  var body = req.body;
  return User.findOneAsync({
    uid: id
  })
    .then(function (user) {
      if(!user) {
        user = new User({
          uid: id
        });
      }
      if(body.isNew === "true") {
        user.sessions.push([body]);
        user.totalVisits++;
        var now = new Date();
        user.timeSinceLastVisit = Math.round((now - user.lastVisitTime)/1000);
        user.lastVisitTime = now;
      } else {
        var activeSession = user.sessions[user.sessions.length - 1];
        if(activeSession.pageName === 'AIR_SEARCH_PAGE') {
          L.error("Incorrect session related information passed");
          return res.send("Session error");
        }
        activeSession.push(body);
        if(body.pageName === 'CONFIRMATION_PAGE') {
          user.timeOfLastPurchase = new Date();
          user.totalPurchases++;
        }
        user.markModified('sessions');
      }
      return user.saveAsync()
        .then(function (data) {
          return res.send(data);
      }).catch(function(e) {
          L.error("Some error occured " + e.message);
      });
  });
};

exports.updatePreference = function(req, res) {

  var id = req.params.id;
  var body = req.body;
  if(id.length === 0 || !req.body) {
    L.error("Missing required data ");
    return res.send('Missing information');
  }

  return User.findOneAsync({
    uid: id
  })
    .then(function (user) {
      if (!user) {
        L.error('Unable to find user with id ' + req.params.id);
        return res.send('Unable to find user');
      }
      user.preference = body;

      return user.saveAsync()
        .then(function (){
          return res.send('preference updated successfully');
        }).catch(function(e) {
          L.error("Some error occured " + e.message);
        });
    });
};

exports.updateFlights = function(req, res){
  var id = req.params.id;
  var body = req.body;
  if(id.length === 0 || !req.body) {
    L.error("Missing required data ");
    return res.send('Missing information');
  }
  return User.findOneAsync({
    uid: id
  })
    .then(function (user) {
      if(!user) {
        L.error('Unable to find user with id ' + req.params.id);
        return res.send('Unable to find user');
      }
      var currentSession = user.sessions[user.sessions.length - 1];
      var flightSelectData = currentSession[currentSession.length - 1];
      flightSelectData.selectedFlights = {};
      if(body.outboundbasketRef) {
        var obBasRef = body.outboundbasketRef;
        var selectedFlight = _.find(flightSelectData.outbounds, function(outbound) {
          return _.find(outbound.basketsRef, function(basket) {
            return basket.brandedBasketHashRef === obBasRef;
          });
        });
        if (selectedFlight) {
          flightSelectData.selectedFlights.outbound = {};
          var selectedBasket = _.find(selectedFlight.basketsRef, function(basket) {
            return basket.brandedBasketHashRef === obBasRef;
          });
          L.info(selectedFlight);
          flightSelectData.selectedFlights.outbound = {
            price: selectedBasket.price,
            basketRef: obBasRef,
            numberOfStops: selectedFlight.numberOfStops,
            flightDuration: selectedFlight.flightDuration,
            totalTripDuration: selectedFlight.totalTripDuration
          };
          user.markModified('sessions');
        }
      }
      if(body.inboundbasketRef) {
        var inBasRef = body.inboundbasketRef;
        var selectedFlight = _.find(flightSelectData.inbounds, function(inbound) {
          return _.find(inbound.basketsRef, function(basket) {
            return basket.brandedBasketHashRef === inBasRef;
          });
        });
        if (selectedFlight) {
          flightSelectData.selectedFlights.inbound = {};
          var selectedBasket = _.find(selectedFlight.basketsRef, function(basket) {
            return basket.brandedBasketHashRef === inBasRef;
          });
          L.info(selectedFlight);
          flightSelectData.selectedFlights.inbound = {
            price: selectedBasket.price,
            basketRef: inBasRef,
            numberOfStops: selectedFlight.numberOfStops,
            flightDuration: selectedFlight.flightDuration,
            totalTripDuration: selectedFlight.totalTripDuration
          };
          user.markModified('sessions');
        }
      }

    return user.saveAsync()
      .then(function (data) {
        return res.send(data);
      }).catch(function(e) {
        L.error("Some error occured " + e.message);
      });
    });
};
