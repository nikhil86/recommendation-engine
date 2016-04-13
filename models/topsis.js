var L = require('../logger'),
  _ = require('underscore');

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

  var minStops = Infinity,
      maxStops = -Infinity;
  _.each(flights, function (flight) {
    minStops = Math.min(minStops, parseFloat(flight.numberOfStops));
    maxStops = Math.max(maxStops, parseFloat(flight.numberOfStops));
  });

  data.StopsRange = {
    "minStops":minStops,
    "maxStops":maxStops,
    "BestStops":minStops,
    "WorstStops":maxStops
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

exports.scoreItins = function (pref, flights) {
  if (pref.preferences) {
    _.each(flights.flights, function (flight) {
      flight.scores = {};
      flight.scores.topsis = [];
      _.each(pref.preferences, function (preference, i) {
        flight.scores.topsis.push([0, 0, 0, 0]);
        for (var k = 0; k < 4; k++) {
          switch (preference.name) {
            case "fare":
              flight.scores.fareScore = fuzzyMember(
                Math.log(parseFloat(flight.totalPrice)),
                [0, 0, Math.log(flights.PriceRange.BestFare), Math.log(flights.PriceRange.WorstFare)]
              );
              flight.scores.topsis[i][k] += flight.scores.fareScore * preference.weights[k];
              break;
            case "stops":
                console.log(flight.numberOfStops);
                console.log(flights.StopsRange.BestStops);
                console.log(flights.StopsRange.WorstStops);
              console.log("----------------------------");
              flight.scores.stopsScore = fuzzyMember(
                  Math.log(parseFloat(flight.numberOfStops)),
                  [0, 0, Math.log(flights.StopsRange.BestStops), Math.log(flights.StopsRange.WorstStops)]
              );
              console.log("----------------------------");
              flight.scores.stopsScore[i][k] += flight.scores.stopsScore * preference.weights[k];
              break;
            case "time":
              flight.scores.timeScore = fuzzyMember(
                Math.log(flight.totalTripDuration),
                [0, 0, Math.log(flights.TotalTravelTimeRange.BestTotalTravelTime), Math.log(flights.TotalTravelTimeRange.WorstTotalTravelTime)]
              );
              flight.scores.topsis[i][k] += flight.scores.timeScore * preference.weights[k];
              break;
            case "outboundDepartTime":
              flight.scores.obdtScore = fuzzyMember(
                parseFloat(flight.departureTime),
                [preference.worst.end, preference.best.start, preference.best.end, preference.worst.start],
                1440
              );
              flight.scores.topsis[i][k] += flight.scores.obdtScore * preference.weights[k];
              break;
            case "outboundArrivalTime":
              flight.scores.obatScore = fuzzyMember(
                parseFloat(flight.arrivalTime),
                [preference.worst.end, preference.best.start, preference.best.end, preference.worst.start],
                1440
              );
              flight.scores.topsis[i][k] += flight.scores.obatScore * preference.weights[k];
              break;
            case "connectionQuality":
              flight.scores.connQualityScore = 1.0;
              _.each(flight.connectionTimes, function (cnxTime) {
                flight.scores.connQualityScore *= fuzzyMember(
                  parseFloat(cnxTime),
                  [preference.worst.end, preference.best.start, preference.best.end, preference.worst.start],
                  1440
                );
              });
              flight.scores.topsis[i][k] += flight.scores.connQualityScore * preference.weights[k];
              break;
          }
        }
      });
      var sPlus = [0, 0, 0, 0],
        sMinus = [0, 0, 0, 0];
      for (var k = 0; k < 4; k++) {
        for (var i = 0; i < pref.preferences.length; i++) {
          sMinus[k] += (flight.scores.topsis[i][k]    ) * (flight.scores.topsis[i][k]    );
          sPlus [3 - k] += (flight.scores.topsis[i][k] - 1) * (flight.scores.topsis[i][k] - 1);
        }
        sMinus[k] = Math.sqrt(sMinus[k]);
        sPlus[3 - k] = Math.sqrt(sPlus[3 - k]);
      }
      flight.scores.sPlus = sPlus;
      flight.scores.sMinus = sMinus;
      flight.scores.lPlus = fuzzyLength(sPlus);
      flight.scores.lMinus = fuzzyLength(sMinus);
      flight.topsisScore = flight.scores.lMinus / (flight.scores.lPlus + flight.scores.lMinus);

      delete flight.scores.lMinus;
      delete flight.scores.sMinus;
      delete flight.scores.lPlus;
      delete flight.scores.sPlus;
      delete flight.scores.topsis;
    });


    var sortedFlights = _.sortBy(flights.flights, function (flight) {
      return flight.topsisScore;
    }).reverse();

    return sortedFlights;
  }
  return null;
};