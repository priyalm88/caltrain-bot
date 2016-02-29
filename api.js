var _ = require('lodash');
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

function getRoutesForCaltrain() {
  var url = buildUrl('/GetRoutesForAgency.aspx', {
    agencyName: 'Caltrain'
  });
  console.log(url);
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var xmlResponse = body;
        parseString(xmlResponse, function (err, result) {
          var routeList = getRouteList(result);
          var routes = _.find(routeList, function (route) {
            return _.get(route, '$.Name').toUpperCase() === 'LOCAL';
          });
          return _.map(routes.RouteDirectionList[0].RouteDirection, '$.Code');
      });
     }
  });
}

function getStopsForRoute(route) {
  // http://services.my511.org/Transit2.0/GetStopsForRoute.aspx?token=token&routeIDF=Caltrain~LOCAL~NB
  var url = buildUrl('/GetStopsForRoute.aspx', {
    routeIDF: 'Caltrain~LOCAL~' + route.toUpperCase()
  });
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
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
        console.log(data);
      });
    }
  });
}

getStopsForRoute('SB3');
