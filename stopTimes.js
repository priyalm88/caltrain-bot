var _ = require('lodash');
var lineReader = require('readline');
var fs = require('fs');

var stopTimes = [];
var currentTripObj = {};

function isNumeric(input) {
  return /^\d+$/.test(input);
}

module.exports = function (cb) {
  var reader = lineReader.createInterface({
    input: fs.createReadStream('./data/stop_times.txt')
  });

  reader.on('line', function (line) {
    // Ignore header line and all train trip_ids which begin with RTD
    // Format is: trip_id,arrival_time,departure_time,stop_id,stop_sequence
    if (!_.startsWith(line, 'trip_id') && !_.startsWith(line, 'RTD')) {
      var attrs = _.split(line, ',');
      if (isNumeric(attrs[0])) {
        if (_.get(currentTripObj, 'tripNumber') !== attrs[0]) {
          // Push existing trip object to final array
          if (currentTripObj) {
            stopTimes.push(currentTripObj);
          }
          // Starting to log a new trip!
          currentTripObj = {
            tripNumber: attrs[0],
            stops: []
          };
        } else {
          // Adding a new stop to the current trip
          currentTripObj.stops.push({
            stopCode: attrs[3],
            arrivalTime: attrs[1]
          });
        }
      }
    }
  });

  reader.on('close', function () {
    cb(stopTimes);
  });
};
