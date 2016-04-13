var L = require('../logger'),
  _ = require('underscore');


var businessUser = {
  preferences: [
    {"name": "fare", "desirability": 0},
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
      "desirability": 3,
      "best": {"start": 360, "end": 420}
    }
  ]
};
var leisureHighEndUser = {
  preferences: [
    {"name": "fare", "desirability": 1},
    {"name": "time", "desirability": 3},
    {"name": "stops", "desirability": 0},
    {
      "name": "outboundDepartTime",
      "desirability": 2,
      "best": {"start": 1060, "end": 1260}
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
};
var leisureFamilyUser = {
  preferences: [
    {"name": "fare", "desirability": 4},
    {"name": "time", "desirability": 1},
    {"name": "stops", "desirability": 0},
    {
      "name": "outboundDepartTime",
      "desirability": 0,
      "best": {"start": 360, "end": 600}
    },
    {
      "name": "arrivalArrivalTime",
      "desirability": 0,
      "best": {"start": 360, "end": 420}
    },
    {
      "name": "connectionQuality",
      "desirability": 3,
      "best": {"start": 180, "end": 360}
    }
  ]
};
var leisureStudentUser = {
  preferences: [
  {"name": "fare", "desirability": 5},
  {"name": "time", "desirability": 0},
  {"name": "stops", "desirability": 0},
  {
    "name": "outboundDepartTime",
    "desirability": 0,
    "best": {"start": 360, "end": 600}
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
]};

var defaultPref = {
  preferences: [
    {"name": "fare", "desirability": 3},
    {"name": "time", "desirability": 2},
    {"name": "stops", "desirability": 0},
    {
      "name": "outboundDepartTime",
      "desirability": 0,
      "best": {"start": 360, "end": 600}
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
  ]};

exports.getDefaultPreference = function (userType) {
  var pref;
  switch (userType) {
    case 'businessUser':
      L.info("");
      L.info("The user has been identified as a BUSINESS user");
      L.info("");
      pref = businessUser;
      break;
    case 'leisureHighEndUser':
      L.info("");
      L.info("The user has been identified as a LEISURE HIGH END user");
      L.info("");
      pref = leisureHighEndUser;
      break;
    case 'leisureFamilyUser':
      L.info("");
      L.info("The user has been identified as a LEISURE FAMILY user");
      L.info("");
      pref = leisureFamilyUser;
      break;
    case 'leisureStudentUser':
      L.info("");
      L.info("The user has been identified as a LEISURE STUDENT user");
      L.info("");
      pref = leisureStudentUser;
      break;
    default :
      L.info("");
      L.info("The user has been identified as a DEFAULT user");
      L.info("");
      pref = defaultPref;
      break;
  }
  return pref;
};