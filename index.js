var Botkit = require('botkit');
var trainHelpers = require('./train');
var scrape = require('./calscrape');
var _ = require('lodash');
var allStopNames = trainHelpers.getStopNames();
var trainwatch = require('./trainwatch');

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


// EXAMPLE OF USING CALSCRAPE
// var calscrape = require('./calscrape');
// calscrape.getArrivalTimes('Bayshore', [156, 264, 274], function(err, times) { console.log('south', times); })
// calscrape.getArrivalTimes('San Mateo', undefined, function(err, times) { console.log('north', times); })


// controller.hears(['hello', 'hi'], ['direct_message', 'direct_mention', 'mention'], function (bot,message) {
//     bot.reply(message,"Hello.");
// });

// controller.hears(['attach'], ['direct_message', 'direct_mention'], function (bot,message) {

//   var attachments = [];
//   var attachment = {
//     title: 'This is an attachment',
//     color: '#FFCC99',
//     fields: []
//   };

//   attachment.fields.push({
//     label: 'Field',
//     value: 'A longish value',
//     short: false
//   });

//   attachment.fields.push({
//     label: 'Field',
//     value: 'Value',
//     short: true
//   });

//   attachment.fields.push({
//     label: 'Field',
//     value: 'Value',
//     short: true
//   });

//   attachments.push(attachment);

//   bot.reply(message,{
//     text: 'See below...',
//     attachments: attachments
//   },function (err,resp) {
//     console.log(err,resp);
//   });
// });
//

function checkStopName(name) {
  return allStopNames.indexOf(name);
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
    if (checkStopName(message.match[1]) === -1) {
      bot.startConversation(message, function (err, convo) {
        botErrMessaging(convo, message.match[1]);
      });
    } else {
      bot.startConversation(message, function (err, convo) {
        convo.say('train times: ' + message.match[1]);
      });
    }
  }
);

controller.hears(['Notify me about trains to (.*)'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    if (checkStopName(message.match[1]) === -1) {
      bot.startConversation(message, function (err, convo) {
        botErrMessaging(convo, message.match[1]);
      });
    } else {
      bot.startConversation(message, function (err, convo) {
        convo.say('next train to: ' + message.match[1]);
      });
    }
  }
);

controller.hears(['Next train to (.*)'],
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
            text: [
            train.type,
            'train',
            train.tripNumber,
            'for',
            destination,
            'leaving in',
            train.wait,
            'minutes.'
          ].join(' '),
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
      convo.say('I`ve cancelled your train notifications.');
      trainwatch.unwatch(message.user);
    });
  }
);
