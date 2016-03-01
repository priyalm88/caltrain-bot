var _ = require('lodash');
var async = require('async');
var parseString = require('xml2js').parseString;
var request = require('request');

var caltrainApiToken = '7b240ec3-306a-413e-a1a0-58ebe83fc79d';
var caltrainUrl = 'http://services.my511.org/Transit2.0';

function convertParamsToString(params) {
  var str = '';
  _.forOwn(params, function (value, key) {
    str += '&' + key + '=' + value;
  });
  return str;
}

function buildUrl(route, params) {
  params = convertParamsToString(params);
  return caltrainUrl + route + '?token=' + caltrainApiToken + params;
}

function getRouteList(obj) {
  return _.get(obj, 'RTT.AgencyList[0].Agency[0].RouteList[0].Route');
}

function getRoutesForCaltrain(cb) {
  var url = buildUrl('/GetRoutesForAgency.aspx', {
    agencyName: 'Caltrain'
  });
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var xmlResponse = body;
        parseString(xmlResponse, function (err, result) {
          var routes = getRouteList(result).map(function(route) {
            return {
              code: route.$.Code,
              directions: _.map(route.RouteDirectionList[0].RouteDirection, '$.Code')
            };
          });
          cb(null, routes);
      });
     }
  });
}

function getStopsForRoute(route, direction, cb) {
  // http://services.my511.org/Transit2.0/GetStopsForRoute.aspx?token=token&routeIDF=Caltrain~LOCAL~NB
  var url = buildUrl('/GetStopsForRoute.aspx', {
    routeIDF: ['Caltrain', route, direction].join('~')
  });
  request(url, function (error, response, body) {
    if (error) { return cb(error); }
    if (response.statusCode == 200) {
      var xmlResponse = body;
      parseString(xmlResponse, function (err, result) {
        var routeList = getRouteList(result);
        var stopList = _.get(routeList, '[0]RouteDirectionList[0].RouteDirection[0].StopList[0].Stop');
        var data = _.map(stopList, function (stop) {
          return {
            name: _.get(stop, '$.name'),
            stopCode: _.get(stop, '$.StopCode')
          };
        });
        cb(null, data);
      });
    } else {
      cb(new Error(response.statusCode));
    }
  });
}

getRoutesForCaltrain(function(err, routes) {
  async.map(routes, function(route, cb) {
    async.map(route.directions, function(direction, cb) {
      getStopsForRoute(route.code, direction, function(err, stops) {
        if (err) { return cb(err); }
        cb(null, {
          direction: direction !== 'NB' ? 'SB' : 'NB',
          stops: stops
        });
      });
    }, cb);
  }, function(err, routes) {
    var stops = routes.reduce(function(acc, stops) {
      stops.forEach(function(stopList) {
        stopList.stops.forEach(function(stop) {
          if (!acc[stop.name]) {
            acc[stop.name] = {};
          }
          acc[stop.name][stopList.direction] = stop.stopCode;
        });
      });
      return acc;
    }, {});
    console.log(stops);
  });
})
