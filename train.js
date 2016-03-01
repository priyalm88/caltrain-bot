var _ = require('lodash');
var data = require('./data/data.json');
var moment = require('moment');
var stops = require('./data/stops.json');

function getRunningServices() {
  var today = moment().subtract(2, 'hour'); // Caltrain considers up to 2am part of the previous day
  return _(data.calendar)
    .filter(function(service) {
      return today.isBetween(moment(service.start_date, 'YYYYMMDD'),
                                moment(service.end_date, 'YYYYMMDD'));
    })
    .filter(function(service) {
      return !!parseInt(service[today.format('dddd').toLowerCase()], 0);
    })
    .map('service_id')
    .value();
}

function getTodaysTripCodes() {
  var runningServices = getRunningServices();
  return _(data.trips)
    .filter(function (trip) {
      return runningServices.indexOf(trip.service_id) !== -1;
    })
    .map('trip_id')
    .value();
}

function getTrips() {
  var todaysTrips = getTodaysTripCodes();
  return _(data.stopTimes)
    .filter(function (stopTime) {
      return todaysTrips.indexOf(stopTime.trip_id) !== -1;
    })
    .map(function (stopTime) {
      var arrival = stopTime.arrival_time.split(':');
      if (arrival[0] === '24' && arrival[1] !== '00') {
        arrival[0] = '00';
      }

      return {
        stopCode: stopTime.stop_id,
        tripNumber: stopTime.trip_id,
        arrivalTime: moment(arrival.join(':'), 'HH:mm:ss')
      }
    })
    .reduce(function(acc, stop) {
      if (!acc[stop.tripNumber]) {
        acc[stop.tripNumber] = {
          tripNumber: stop.tripNumber,
          stops: []
        };
      }

      acc[stop.tripNumber].stops.push(_.pick(stop, ['stopCode', 'arrivalTime']));
      return acc;
    }, {});
}


function getTrainsFor(stopCodes, cb) {
  function filterStops(stops) {
    return _(stops)
      .filter(function(stop) {
       return stopCodes.indexOf(stop.stopCode) !== -1;
      })
      .orderBy(function(stop) {
        return stop.arrivalTime.valueOf()
      }, 'desc')
      .value();
  }

  var trips = _(getTrips())
    .map(function(trip) {
      return {
        tripNumber: trip.tripNumber,
        stops: filterStops(trip.stops),
      };
    })
    .filter(function(trip) {
      return trip.stops.length === 2; // Both the stops should be serviced by this train!
    })
    .value();

  cb(null, trips);
}

function getCodesForTrip(departureStation, arrivalStation, cb) {
  var foundStops = stops.filter(function(stop) {
    return [departureStation.toUpperCase(), arrivalStation.toUpperCase()].indexOf(stop.name.toUpperCase()) !== -1;
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
