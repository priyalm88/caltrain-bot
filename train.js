var stopTimes = require('./stopTimes');
var stops = require('./data/stops.json');
var _ = require('lodash');

function getTrainsFor(stopCodes, cb) {
  var result = [];
  stopTimes(function (data) {
    _.forEach(data, function (trip) {
      var stopsArray = _.filter(trip.stops, function (stop) {
        return stopCodes.indexOf(stop.stopCode) !== -1;;
      });
      // Both the stops should be serviced by this train!
      if (stopsArray.length === 2) {
        result.push({
          tripNumber: trip.tripNumber,
          stops: stopsArray
        });
      }
    });
    cb(null, result);
  });
}

function getCodesForTrip(departureStation, arrivalStation, cb) {
  var foundStops = stops.filter(function(stop) {
    return [departureStation, arrivalStation].indexOf(stop.name) !== -1;
  });

  if (foundStops.length !== 2) {
    return cb(new Error('Stops not found.'));
  }

  var direction = foundStops[0].name === departureStation ? 'SB' : 'NB';

  cb(null, foundStops.map(function(stop) {
    return stop[direction];
  }));
}

function getStopNames() {
  return stops.map(function(stop) {
    return stop.name;
  })
}

module.exports = {
  getTrainsFor: getTrainsFor,
  getCodesForTrip: getCodesForTrip,
  getStopNames: getStopNames
};
