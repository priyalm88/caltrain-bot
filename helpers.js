var stopTimes = require('./stopTimes');
var _ = require('lodash');

function getTrainsFor(departCode, arrivalCode) {
  var result = [];
  stopTimes(function (data) {
    _.forEach(data, function (trip) {
      var stopsArray = _.filter(trip.stops, function (stop) {
        return stop.stopCode === departCode || stop.stopCode === arrivalCode;
      });
      // Both the stops should be serviced by this train!
      if (stopsArray.length === 2) {
        result.push({
          tripNumber: trip.tripNumber,
          stops: stopsArray
        });
      }
    });
    console.log(result);
  });
}

function getTrainsFromSanMateoTo(arrivalCode) {
  getTrainsFor('70091', arrivalCode);
}

module.exports = {
  getTrainsFromSanMateoTo: getTrainsFromSanMateoTo;
};
