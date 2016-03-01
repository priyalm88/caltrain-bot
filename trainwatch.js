var calscrape = require('./calscrape.js');
var _ = require('lodash');
var trainHelpers = require('./train.js');
var watchers = {};

function watch(user, departureStation, arrivalStation, cb) {
  trainHelpers.getCodesForTrip(departureStation, arrivalStation, function(err, stopCodes) {
    trainHelpers.getTrainsFor(stopCodes, function(err, trains) {
      var tripNumbers = trains.map(function(trip) {
        return parseInt(trip.tripNumber, 0);
      });

      watchers[user] = {
        tripNumbers: tripNumbers,
        departureStation: departureStation,
        cb: cb
      };

      checkWatcher(watchers[user]);
    });
  });
}

function unwatch(user) {
  delete watchers[user];
}

function checkWatcher(watcher) {
  calscrape.getArrivalTimes(watcher.departureStation, watcher.tripNumbers, function(err, arrivals) {
    var nextTrain = _.find(arrivals, function(arrival) {
      return arrival.wait < 30;
    });

    if (nextTrain) {
      watcher.cb(null, nextTrain);
    }
  });
}

function alert() {
  _.forEach(watchers, checkWatcher);
}

module.exports = {
  watch: watch,
  unwatch: unwatch
}
