var request = require('request');
var cheerio = require('cheerio');

function getCallbackId(cb) {
  request.get('http://www.caltrain.com/schedules/realtime.html', function(err, response, body) {
    var callerIdIndex = body.indexOf('ipjstCallerId');
    cb(null, body.slice(callerIdIndex + 13, callerIdIndex + 26).split('"')[1]);
  });
}

function getArrivalTimes(stationName, tripNumbers, cb) {
  getCallbackId(function(err, callbackId) {
    if (err) { return cb(err); }

    request.post({
      url: 'http://www.caltrain.com/schedules/realtime.html',
      form: {
        '__CALLBACKID': callbackId,
        '__CALLBACKPARAM': 'refreshStation=' + stationName, // @todo plus stationName
        '__EVENTTARGET': '',
      }
    }, function(err, response, body) {
      if (err) { return cb(err); }

      var arrivals = parseArrivals(body);
      if (tripNumbers) {
        arrivals = arrivals.filter(function(arrival) {
          return tripNumbers.indexOf(arrival.tripNumber) !== -1;
        });
      }

      cb(null, arrivals);
    });
  });
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
