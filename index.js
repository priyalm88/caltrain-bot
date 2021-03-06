var Botkit = require('botkit');
var trainHelpers = require('./train');
var _ = require('lodash');
var allStopNames = trainHelpers.getStopNames();
var trainwatch = require('./trainwatch');
var moment = require('moment');

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
 debug: false
});

controller.spawn({
  token: process.env.token
}).startRTM(function (err) {
  if (err) {
    throw new Error(err);
  }
});

function checkStopName(name) {
  return _.some(allStopNames, function (stopName) {
    return stopName.toUpperCase() === name.toUpperCase();
  });
}

function formattedStopNames() {
  return _.map(_.chunk(allStopNames, 5), function (chunk) {
    return chunk.join('\t');
  }).join('\n');
}

function botErrMessaging(convo, cityName) {
  convo.say('The train does not stop at ' + cityName + ' :disappointed:');
  convo.say('Do you want to go to one of these instead?\n' + formattedStopNames());
}

// Compare dates to sort
function compareMilli(a, b) {
  if (a.milli < b.milli) {
    return -1;
  }
  if (a.milli > b.milli) {
    return 1;
  }
  return 0;
}

function formatTrains(trains, destination) {
  return _.map(trains, function (train) {
    return [
      'Train',
      train.tripNumber,
      'departing from San Mateo at',
      train.stops[0].arrivalTime.format('h:mm a'),
      'and arriving in',
      destination,
      'at',
      train.stops[1].arrivalTime.format('h:mm a')
    ].join(' ');
  });
}

controller.hears(['help'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.say(['Hi, here\'s some things you can try:',
        '1. Train times to <Caltrain stop name>',
        '2. Next train to <Caltrain stop name>?',
        '3. Notify me about trains to <Caltrain stop name>',
        '4. Cancel notifications'].join('\n')
      );
    })
  }
);

controller.hears(['Train times to (.*)'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    var destination = message.match[1];
    if (checkStopName(destination) === -1) {
      bot.startConversation(message, function (err, convo) {
        botErrMessaging(convo, destination);
      });
    } else {
      bot.startConversation(message, function (err, convo) {
        trainHelpers.getCodesForTrip('San Mateo', destination, function (err, stopCodes) {
          trainHelpers.getTrainsFor(stopCodes, function (err, trains) {
            var possibleTrains = _.filter(trains, function (train) {
              var now = moment().subtract(2, 'hour'),
                arrival = train.stops[0].arrivalTime.clone().subtract(2, 'hour').day(now.day());

              return arrival.isAfter(now);
            });
            if (!possibleTrains.length) {
              bot.say({
                text: 'There are no more trains to ' + destination + ' today',
                channel: message.channel
              });
            } else {
              var formatted = formatTrains(possibleTrains, destination);
              bot.say({
                text: _.take(formatted, 3).join('\n'),
                channel: message.channel
              });
              convo.ask('Do you want to see all the trains?',[
                {
                  pattern: bot.utterances.yes,
                  callback: function(response,convo) {
                    convo.say(formatted.join('\n'));
                    convo.next();
                  }
                },
                {
                  pattern: bot.utterances.no,
                  callback: function(response,convo) {
                    convo.say('Perhaps later.');
                    convo.next();
                  }
                },
                {
                  default: true,
                  callback: function(response,convo) {
                    convo.say('Perhaps later.');
                    convo.next();
                  }
                }
              ]);
            }
          });
        });
      });
    }
  }
);

function formatLiveTime(train, destination) {
  return [train.type, 'train', train.tripNumber, 'to', destination, 'leaving in', train.wait, 'minutes.'].join(' ');
}

controller.hears(['Next train to (.*)', 'next (.*) train'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    var destination = message.match[1];

    if (checkStopName(message.match[1]) === -1) {
      bot.startConversation(message, function (err, convo) {
        botErrMessaging(convo, message.match[1]);
      });
    } else {
      bot.startConversation(message, function (err, convo) {
        trainwatch.getLiveTrainTimes('San Mateo', destination, function (err, trains) {
          bot.say({
            text: trains.map(function(train) { return formatLiveTime(train, destination); }).join('\n'),
            channel: message.channel
          })
          console.log(trains);
        })
      });
    }
  }
);

controller.hears(['Notify me about trains to (.*)', 'notify (.*) trains'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      var destination = message.match[1];
      if (checkStopName(destination) === -1) {
      bot.startConversation(message, function (err, convo) {
        botErrMessaging(convo, destination);
      });
    } else {
        convo.say(['I will let you know when trains to', destination, 'are approaching.'].join(' '));
        trainwatch.watch(message.user, 'San Mateo', destination, function(err, train) {
          bot.say({
            text: formatLiveTime(train, destination),
            channel: message.channel
          });
        });
      }
    });
  }
);


controller.hears(['Cancel notifications'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.say('I`ve canceled your train notifications.');
      trainwatch.unwatch(message.user);
    });
  }
);
