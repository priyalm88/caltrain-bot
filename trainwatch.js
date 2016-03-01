var calscrape = require('./calscrape.js');
var _ = require('lodash');
var trainHelpers = require('./train.js');
var watchers = {};

function watch(user, departureStation, arrivalStation, cb) {
  getTripNumbers(departureStation, arrivalStation, function(err, tripNumbers) {
    watchers[user] = {
      tripNumbers: tripNumbers,
      tripsSeen: [],
      departureStation: departureStation,
      cb: cb
    };

    checkWatcher(watchers[user]);
  });
}

function unwatch(user) {
  delete watchers[user];
}

function checkWatcher(watcher) {
  calscrape.getArrivalTimes(watcher.departureStation, watcher.tripNumbers, function(err, arrivals) {
    var nextTrain = _(arrivals)
      .filter(function(arrival) {
        return watcher.tripsSeen.indexOf(arrival.tripNumber) === -1;
      })
      .find(function(arrival) {
        return arrival.wait < 90;
      });

    if (nextTrain) {
      watcher.tripsSeen.push(nextTrain.tripNumber);
      watcher.cb(null, nextTrain);
    }
  });
}

setInterval(function() {
  _.forEach(watchers, checkWatcher);
}, 5000);

function getTripNumbers(departureStation, arrivalStation, cb) {
  trainHelpers.getCodesForTrip(departureStation, arrivalStation, function(err, stopCodes) {
    trainHelpers.getTrainsFor(stopCodes, function(err, trains) {
      cb(null, _.map(trains, 'tripNumber'));
    });
  });
}

function getLiveTrainTimes(departureStation, arrivalStation, cb) {
  getTripNumbers(departureStation, arrivalStation, function(err, tripNumbers) {
    calscrape.getArrivalTimes(departureStation, tripNumbers, cb);
  })
}

module.exports = {
  getLiveTrainTimes: getLiveTrainTimes,
  watch: watch,
  unwatch: unwatch,
}
