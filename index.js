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

controller.hears(['train times', 'train time'],
  ['direct_message', 'direct_mention', 'mention'],
  function (bot, message) {
    bot.startConversation(message,function (err,convo) {
      convo.say('Sending you train times privately');
    });

    bot.startPrivateConversation(message,function (err,dm) {
      dm.say('Here are the train times');
    });

});
