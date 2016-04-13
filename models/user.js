var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('underscore'),
  L = require('../logger'),
  moment = require('moment'),
  PrefType = require('./PreferenceTypes'),
  B = require("bluebird");

var UserSchema = new Schema({
  uid: String,
  name: String,
  totalVisits: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  lastVisitTime: { type: Date, default: Date.now },
  timeSinceLastVisit: { type: Number, default: 0 }, // in seconds
  timeOfLastPurchase: Date,
  sessions: [Schema.Types.Mixed],
  preference: Schema.Types.Mixed
});

var preferences = [
  {
    'type': 'Premium Business',
    'cabin': ['BUSINESS', 'FIRST'],
    'daysToDepart': {
      min: 0,
      max: 80
    },
    'child': 0,
    'infant': 0,
    'adt': {
      min: 1,
      max: 2
    },
    preferences: [
      {"name": "fare", "desirability": 0},
      {"name": "time", "desirability": 4},
      {"name": "stops", "desirability": 0},
      {
        "name": "outboundDepartTime",
        "desirability": 2,
        "best": {"start": 420, "end": 540}
      },
      {
        "name": "arrivalArrivalTime",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      },
      {
        "name": "connectionQuality",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      }
    ]
  },
  {
    'type': 'Economy Business',
    'cabin': ['ECONOMY'],
    'daysToDepart': {
      min: 2,
      max: 150
    },
    'child': 0,
    'infant': 0,
    'adt': {
      min: 1,
      max: 2
    },
    preferences: [
      {"name": "fare", "desirability": 0},
      {"name": "time", "desirability": 0},
      {"name": "stops", "desirability": 0},
      {
        "name": "outboundDepartTime",
        "desirability": 2,
        "best": {"start": 900, "end": 1000},
        "worst": {"start": 180, "end": 300}
      },
      {
        "name": "arrivalArrivalTime",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      },
      {
        "name": "connectionQuality",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      }
    ]
  },
  {
    'type': 'Economy Leisure',
    'cabin': ['ECONOMY'],
    'daysToDepart': {
      min: 0,
      max: 80
    },
    'child': 0,
    'infant': 0,
    'adt': {
      min: 2,
      max: 99
    },
    preferences: [
      {"name": "fare", "desirability": 5},
      {"name": "time", "desirability": 0},
      {"name": "stops", "desirability": 0},
      {
        "name": "outboundDepartTime",
        "desirability": 0,
        "best": {"start": 420, "end": 540}
      },
      {
        "name": "arrivalArrivalTime",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      },
      {
        "name": "connectionQuality",
        "desirability": 0,
        "best": {"start": 360, "end": 420}
      }
    ]
  }
];

UserSchema.statics.parsePreference = function (body) {
  var currentTime = moment();
  var dateOfDeparture = moment(body.departureDate.replace(/\//g, '-'));
  var daysBookedInAdvance = dateOfDeparture.diff(currentTime, 'days');
  var data = {
    cabin: body.cabin,
    daysToDeparture: daysBookedInAdvance,
    child: body.CHD,
    infant: body.INF,
    adt: body.ADT
  };
  var options = {};
  _.each(preferences, function (pref) {
    if (_.indexOf(pref.cabin, data.cabin) > -1 &&
        data.daysToDeparture >= pref.daysToDepart.min && data.daysToDeparture <= pref.daysToDepart.max &&
        pref.child === parseInt(data.child) &&
        pref.infant === parseInt(data.infant) &&
        data.adt >= pref.adt.min && data.adt <= pref.adt.max) {
      L.info("");
      L.info("The user has been identified as a " + pref.type);
      L.info("");
      options.preferences = pref.preferences
    }
  });
  return options;
};

UserSchema.methods.toBriefJSON = function () {
  var me = this;
  var lastTenSessions = _.map(_.last(me.sessions, 10), function (session) {
    return _.first(session);
  });

  var uniqueSearches = _.uniq(lastTenSessions, function (search) {
    search = _.omit(search, 'dateTime');
    var keys = _.keys(search).sort();
    var values = _.map(keys, function (key) {
      return search[key];
    });
    return values.join('');
  });

  return {
    'searches': _.last(uniqueSearches, 2).reverse(),
    'preference': me.preference
  };
};

UserSchema.methods.countSimilarSearches = function (searchcriteria) {
  var me = this;
  var lastSearch;
  if(_.isEmpty(searchcriteria)) {
    lastSearch = _.last(me.sessions)[0];
  }else{
    lastSearch = searchcriteria;
  }
  lastSearch = _.omit(lastSearch, 'dateTime');
  var keys = _.keys(lastSearch).sort();
  var values = _.map(keys, function (key) {
    return lastSearch[key];
  });
  var searchId = values.join('');

  // find all exact searches made in the past one week
  var pastTimeLimit = moment().subtract(7, 'day').unix();
  var count = 0;
  _.each(me.sessions, function (session) {
    var searchObj = _.first(session);
    if(parseInt(searchObj.dateTime) >= pastTimeLimit) {
      searchObj = _.omit(searchObj, 'dateTime');
      var pKeys = _.keys(searchObj).sort();
      var pValues = _.map(pKeys, function (key) {
        return searchObj[key];
      });
      var pSearchId = pValues.join('');
      if(searchId === pSearchId) {
        count++;
        return searchObj;
      }
    }
  });
  return count;
};

UserSchema.methods.getLastSearch = function () {
  var me = this;
  var lastSessionNumber = me.sessions.length - 1;
  var activeSession = me.sessions[lastSessionNumber];
  var searchData = activeSession[0];
  if(searchData.pageName === 'AIR_SEARCH_PAGE') {
    return searchData;
  } else {
    return null;
  }
};

UserSchema.methods.getAncillaries = function () {
  var me = this;
  var lastThreeSessions = _.last(me.sessions, 5);
  var lastFewPurchasePages = _.map(lastThreeSessions, function(session) {
    var purchasePage = _.find(session, function (s) {
      return s.pageName === 'PURCHASE_PAGE';
    });
    return (purchasePage || {}).ancillaries;
  });

  var ancillaryCOdes = _.reduce(lastFewPurchasePages, function (memo, t) {
    return _.reduce(t, function (keep, obj) {
      keep.push(obj.code);
      return keep;
    }, memo)
  }, []);

  var final = [];
  for(var i = 0; i < ancillaryCOdes.length; i++) {
    var obj = {code: ancillaryCOdes[i], count: 1};
    for(var j = i+1; j < ancillaryCOdes.length; j++) {
      if(ancillaryCOdes[i] === ancillaryCOdes[j]) {
        obj.count++;
      }
    }
    final.push(obj)
  }

  final = _.uniq(final, function (f) {
    return f.code
  });

  final = _.sortBy(final, function (f) {
    return f.count;
  });
  return final.reverse();
};

UserSchema.methods.getPriceIncrementPercentage = function (isMobile) {
  var price = 2;
  if(isMobile === "true") {
    price = 5;
  }
  return price;
};

var Model = mongoose.model('User', UserSchema);
B.promisifyAll(Model);
B.promisifyAll(Model.prototype);
module.exports = Model;