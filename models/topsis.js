var L = require('../logger'),
  _ = require('underscore');

// checks if an item is in an array
var isInArray = function (item, arr) {
  var answer = (item === arr);
  if (arr && arr.length) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) answer = true;
    }
  }
  return answer;
};

exports.parsePrefs = function (prefString) {
  var pref, preference = {};
  try {
    pref = prefString;
    var prefnames = [], warnings = [];
    if (pref && pref.preferences && pref.preferences.length > 0) {
      preference.fuzzyLevel = Math.min(1, Math.max(0, pref.fuzzyLevel || 0));
      preference.preferences = [];
      var totalDesirability = 0;
      for (var i = 0; i < pref.preferences.length; i++) {
        totalDesirability += Math.max(0, pref.preferences[i].desirability);
      }
      for (var i = 0; i < pref.preferences.length; i++) {
        var prefItem = pref.preferences[i];
        if (prefItem.name === "time" || prefItem.name === "outboundTravelTime" ||
            prefItem.name === "inboundTravelTime" || prefItem.name === "fare" || prefItem.name === "stops") {
          delete prefItem.best;
          delete prefItem.worst;
        }
        else if (prefItem.name === "outboundDepartTime" || prefItem.name === "outboundArrivalTime" ||
                 prefItem.name === "inboundDepartTime" || prefItem.name === "inboundArrivalTime" ||
                 prefItem.name === "connectionQuality") {
          prefItem.best = prefItem.best || {"start":null, "end":null};
          prefItem.worst = prefItem.worst || {"start":null, "end":null};
        } else if (prefItem.name === "carrier") {
          prefItem.best = prefItem.best || [];
          prefItem.worst = prefItem.worst || [];
        } else if (prefItem.name === "depDate" || prefItem.name === "retDate" || prefItem.name === "los" ||
                   prefItem.name === "connectPoint") {
          prefItem.best = prefItem.best || [];
          prefItem.worst = prefItem.worst || [];
        }

        prefItem.scaledDesirability = totalDesirability > 0 ? Math.max(prefItem.desirability, 0) / totalDesirability : 1;

        prefItem.weights = [
          prefItem.scaledDesirability * (1 - preference.fuzzyLevel),
          prefItem.scaledDesirability * (1 - preference.fuzzyLevel),
          prefItem.scaledDesirability + (1 - prefItem.scaledDesirability) * preference.fuzzyLevel,
          prefItem.scaledDesirability + (1 - prefItem.scaledDesirability) * preference.fuzzyLevel
        ];

        if (isInArray(prefItem.name, prefnames)) {
          warnings.push("Preference " + prefItem.name + " has appeared in the request multiple times." +
                        " Only the first occurence was effective."
                       )
        } else {
          if (prefItem.desirability > 0) {
            preference.preferences.push(prefItem);
          }
          prefnames.push(prefItem.name);
        }
      }
      preference.isValid = true;
    } else {
      // Default logic
      preference.isValid = false;
      preference.message = "An array of preferences cannot be found in the request body";
    }
    if (warnings.length > 0) preference.warnings = warnings;

    return preference;
  } catch (e) {
    console.info(e.toString());
    return {"isValid":false, "message":"Preference string is not valid JSON.", "exception":e.toString};
  }
};

exports.parseFlights = function (flights) {
  var minFare = Infinity,
    maxFare = -Infinity;
  var data = {};
  data.flights = flights;

  _.each(flights, function (flight) {
    minFare = Math.min(minFare, parseFloat(flight.totalPrice));
    maxFare = Math.max(maxFare, parseFloat(flight.totalPrice));
  });

  data.PriceRange = {
    "MinFare":minFare,
    "MaxFare":maxFare,
    "BestFare":minFare,
    "WorstFare":Math.min(minFare * 5, Math.max(maxFare, minFare * 2))
  };

  var minTotalTravelTime = Infinity,
    maxTotalTravelTime = -Infinity;

  _.each(flights, function (flight) {
    minTotalTravelTime = Math.min(minTotalTravelTime, flight.totalTripDuration);
    maxTotalTravelTime = Math.max(maxTotalTravelTime, flight.totalTripDuration);
  });

  data.TotalTravelTimeRange = {
    "MinTotalTravelTime":minTotalTravelTime,
    "MaxTotalTravelTime":maxTotalTravelTime,
    "BestTotalTravelTime":minTotalTravelTime,
    "WorstTotalTravelTime":Math.min(5 * minTotalTravelTime, Math.max(2 * minTotalTravelTime, maxTotalTravelTime))
  };

  var minStops = Infinity,
    maxStops = -Infinity;

  _.each(flights, function (flight) {
    minStops = Math.min(minStops, parseFloat(flight.numberOfStops));
    maxStops = Math.max(maxStops, parseFloat(flight.numberOfStops));
  });

  data.StopsRange = {
    "minStops":minStops,
    "maxStops":maxStops,
    "BestFare":minFare,
    "WorstFare":maxStops
  };

  return data;
};

// x is a scalar and fuzzy is an array of length 4
var fuzzyMember = function (x, fuzzy, period) {
  period = period || Infinity;
  while (x < 0) x += period;
  x = x % period;
  for (var i = 0; i < 4; i++) {
    while (fuzzy[i] < 0) fuzzy[i] += period;
    fuzzy[i] = fuzzy[i] % period;
    if (i > 0 && fuzzy[i] < fuzzy[i - 1]) {
      if (x < fuzzy[i]) x += period;
      fuzzy[i] += period;
    }
  }

  if (x < fuzzy[0] || x > fuzzy[3]) return 0;
  else if (x > fuzzy[1] && x < fuzzy[2]) return 1;
  else if (x >= fuzzy[0] && x <= fuzzy[1]) return fuzzy[1] > fuzzy[0] ? (x - fuzzy[0]) / (fuzzy[1] - fuzzy[0]) : 0.5;
  else if (x >= fuzzy[2] && x <= fuzzy[3]) return fuzzy[3] > fuzzy[2] ? (x - fuzzy[3]) / (fuzzy[2] - fuzzy[3]) : 0.5;
};


var fuzzyLength = function (x) {
  var s32 = x[2] + x[1];
  var d43 = x[3] - x[2];
  var d32 = x[2] - x[1];
  var d21 = x[1] - x[0];

  var lsqr = (s32 / 2) * (s32 / 2) +
      (1 / 3) * (s32 / 2) * (d43 - d21) +
      (2 / 3) * (d32 / 2) * (d32 / 2) +
      (1 / 9) * (d32 / 2) * (d43 + d21) +
      (1 / 18) * (d43 * d43 + d21 * d21) -
      (1 / 18) * (d43 * d21);

  return Math.sqrt(lsqr);
};

// 1 For each flight, for each attribute, calculate value
// 2 Each attribute is divided by sum of squares of its values
// 3 Construct weighted standardized decision matrix by multiplying attributes weight to each rating
// 4 Determine ideal solution and negative idea solution
// 5 Determine separation from ideal solution and negative ideal solution
// 6 Determine relative closeness to ideal solution
exports.scoreItins = function (pref, flights) {
  if (pref.preferences) {

    _.each(flights.flights, function(flight) {

      flight.scores = {};
      //flight.scores.topsis = [];

      _.each(pref.preferences, function(preference, i) {
        //flight.scores.topsis.push([0, 0, 0, 0]);
        //for (var k = 0; k < 4; k++) {
          switch (preference.name) {

            case "stops":
              if (parseFloat(flight.numberOfStops) === 0) {
                flight.scores.stops = 1;
              } else if (parseFloat(flight.numberOfStops) === 1) {
                flight.scores.stops = 0.6;
              } else if (parseFloat(flight.numberOfStops) === 2) {
                flight.scores.stops = 0.3;
              } else {
                flight.scores.stops = 0;
              }
              break;

            case "fare":
              flight.scores.fare = flights.PriceRange.MinFare / parseFloat(flight.totalPrice);
              break;

            case "time":
              flight.scores.time = flights.TotalTravelTimeRange.MinTotalTravelTime / parseFloat(flight.totalTripDuration);
              break;

            case "outboundDepartTime":
              flight.scores.outboundDepartTime = fuzzyMember(
                parseFloat(flight.departureTime),
                [preference.worst.end, preference.best.start, preference.best.end, preference.worst.start],
                1440);
              break;

            case "outboundArrivalTime":
              flight.scores.outboundArrivalTime = fuzzyMember(
                parseFloat(flight.arrivalTime),
                [preference.worst.end, preference.best.start, preference.best.end, preference.worst.start],
                1440);
              break;

            case "connectionQuality":
              flight.scores.connectionQuality = 1.0;
              _.each(flight.connectionTimes, function(cnxTime) {
                var cnxTimeNum = parseFloat(cnxTime);
                if (cnxTimeNum == 0) {
                  flight.scores.connectionQuality *= 1;
                } else if (cnxTimeNum <= 60) {
                  flight.scores.connectionQuality *= (1 / 60) * cnxTimeNum;
                } else {
                  flight.scores.connectionQuality *= 60 / cnxTimeNum;
                }
              });
              if (parseFloat(flight.numberOfStops) === 0) {
                flight.scores.connectionQuality = 1;
              }
              break;

          }
        //}
      });
    });

    var ideal_solution = {};
    var negative_ideal_solution = {};

    _.each(pref.preferences, function(preference, i) {
      // standardize the decision matrix
      sum_of_squares = 0;
      _.each(flights.flights, function(flight) {
        sum_of_squares += flight.scores[preference.name] * flight.scores[preference.name];
      });
      sqrt_sum_squares = Math.sqrt(sum_of_squares);
      _.each(flights.flights, function(flight) {
        flight.scores[preference.name] = flight.scores[preference.name] / sqrt_sum_squares;
      });

      // multiply the respective preference weights
      _.each(flights.flights, function(flight) {
        flight.scores[preference.name] = flight.scores[preference.name] * preference.desirability;
      });

      // find ideal solution
      ideal_solution[preference.name] = -Infinity;
      _.each(flights.flights, function(flight) {
        ideal_solution[preference.name] = Math.max(flight.scores[preference.name], ideal_solution[preference.name]);
      });

      // find negative ideal solution
      negative_ideal_solution[preference.name] = Infinity;
      _.each(flights.flights, function(flight) {
        negative_ideal_solution[preference.name] = Math.min(flight.scores[preference.name], negative_ideal_solution[preference.name]);
      });

    });

    // find separation from ideal and negative ideal solution and then calculate topsis score
    _.each(flights.flights, function(flight) {
      flight.ideal_separation = 0;
      flight.negative_ideal_separation = 0;

      _.each(pref.preferences, function(preference, i) {
        flight.ideal_separation += (flight.scores[preference.name] - ideal_solution[preference.name]) * (flight.scores[preference.name] - ideal_solution[preference.name]);
        flight.negative_ideal_separation += (flight.scores[preference.name] - negative_ideal_solution[preference.name]) * (flight.scores[preference.name] - negative_ideal_solution[preference.name]);
      });

      flight.ideal_separation = Math.sqrt(flight.ideal_separation);
      flight.negative_ideal_separation = Math.sqrt(flight.negative_ideal_separation);
      flight.topsisScore = flight.negative_ideal_separation / (flight.ideal_separation + flight.negative_ideal_separation);
    });

    var sortedFlights = _.sortBy(flights.flights, function(flight) {
      return flight.topsisScore;
    }).reverse();

    return sortedFlights;
  }
  return null;
};
