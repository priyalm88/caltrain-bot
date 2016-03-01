var stops = require('./data/stops.json');

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
  getCodesForTrip: getCodesForTrip,
  getStopNames: getStopNames
};
