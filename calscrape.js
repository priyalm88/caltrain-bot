var request = require('request');
var cheerio = require('cheerio');
var moment  = require('moment');

var callbackIdCache;
var stationCache = {};

function getCallbackId(ignoreCache, cb) {
  if (!ignoreCache && callbackIdCache && moment().isBefore(callbackIdCache.expiration)) {
    return cb(null, callbackIdCache.value);
  }

  request.get('http://www.caltrain.com/schedules/realtime.html', function(err, response, body) {
    if (err) { return cb(err); }

    var callbackIdIndex = body.indexOf('ipjstCallerId'),
      callbackId = body.slice(callbackIdIndex + 13, callbackIdIndex + 26).split('"')[1];

    callbackIdCache = {
      value: callbackId,
      expiration: moment().add(5, 'minutes')
    };

    cb(null, callbackId);
  });
}

function getArrivalTimes(stationName, tripNumbers, cb) {
  getCallbackId(false, function(err, callbackId) {
    if (err) { return cb(err); }

    if (stationCache[stationName] && moment().isBefore(stationCache[stationName].expiration)) {
      return cb(null, filterArrivals(stationCache[stationName].value, tripNumbers))
    }

    request.post({
      url: 'http://www.caltrain.com/schedules/realtime.html',
      form: {
        '__CALLBACKID': callbackId,
        '__CALLBACKPARAM': 'refreshStation=' + stationName,
        '__EVENTTARGET': '',
      }
    }, function(err, response, body) {
      if (err) { return cb(err); }

      var arrivals = parseArrivals(body);

      stationCache[stationName] = {
        value: arrivals,
        expiration: moment().add(1, 'minutes')
      };

      cb(null, filterArrivals(arrivals, tripNumbers));
    });
  });
}

function filterArrivals(arrivals, tripNumbers) {
  if (tripNumbers) {
    return arrivals.filter(function(arrival) {
      return tripNumbers.indexOf(arrival.tripNumber) !== -1;
    });
  } else {
    return arrivals;
  }
}

function parseArrivals(body) {
  var $ = cheerio.load(body);
  var directions = parseDirections($);
  return parseTimes($).reduce(function(arrivals, timeSet, index) {
    timeSet.forEach(function(arrival) {
      arrival.direction = directions[index];
    });

    return arrivals.concat(timeSet);
  }, []);
}

function parseDirections($) {
  return mapGetText($, $('.ipf-st-ip-trains-table-dir-tr').children('th'));
}

function parseTimes($) {
  var parsedTimes = [];

  $('.ipf-st-ip-trains-subtable')
    .each(function(index, element) {
      var types = mapGetText($, $(element).find('.ipf-st-ip-trains-subtable-td-type'));
      var tripNumbers = mapGetText($, $(element).find('.ipf-st-ip-trains-subtable-td-id'));
      var times = mapGetText($, $(element).find('.ipf-st-ip-trains-subtable-td-arrivaltime'));

      parsedTimes.push(types.map(function(type, index) {
        return {
          type: type,
          tripNumber: parseInt(tripNumbers[index], 0),
          wait: parseInt(times[index].split(' ')[0], 0)
        };
      }));
    });

  return parsedTimes;
}

function mapGetText($, elements) {
  return elements
    .map(function(index, element) {
      return $(element).text();
    })
    .get();
}

module.exports = {
  getArrivalTimes: getArrivalTimes
}
