var Botkit = require('botkit');


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
controller.hears(['help'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.say('Hi' + message.user + ', here\'s some things you can try:\n' +
        '1. Train times to <Caltrain stop name>\n' +
        '2. When is the next train to <Caltrain stop name>?\n'
      );
    })
  }
);

controller.hears(['Train times to (.*)'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.say('train times: ' + message.match[1]);
    });
  }
);

controller.hears(['When is the next train to (.*)?'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message, function (err, convo) {
      convo.say('first train: ' + message.match[1]);
    });
  }
);
