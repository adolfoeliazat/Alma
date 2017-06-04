const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const StateEngine = require('./StateEngine')
const states = new StateEngine()

let bot = new Bot();

function setState(session, state) {
  session.set('state', state);
  session.set('startTimestamp', Date.now());
}

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      setState(session, 'welcome');
      break
    case 'Message':
      const twoHours = 2 * 60 * 60 * 1000;
      if (Date.now() - session.get('startTimestamp') > twoHours)
        setState(session, 'welcome');

      // Debug functionality
      if (message.body.substring(0,6) == '/debug')
        setState(session, message.body.substring(7))

      states.getState(session).onMessage(session, message)
      break
    case 'Command':
      states.getState(session).onCommand(session, message)
      break
    case 'Payment':
      states.getState(session).onPayment(session, message)
      break
    case 'PaymentRequest':
      states.getState(session).onPaymentRequest(session)
      break
  }
}
//
// function onMessage(session, message) {
//   welcome(session)
// }
//
// function onCommand(session, command) {
//   switch (command.content.value) {
//     case 'ping':
//       pong(session)
//       break
//     case 'count':
//       count(session)
//       break
//     case 'donate':
//       donate(session)
//       break
//     }
// }
//
// function onPayment(session, message) {
//   if (message.fromAddress == session.config.paymentAddress) {
//     // handle payments sent by the bot
//     if (message.status == 'confirmed') {
//       // perform special action once the payment has been confirmed
//       // on the network
//     } else if (message.status == 'error') {
//       // oops, something went wrong with a payment we tried to send!
//     }
//   } else {
//     // handle payments sent to the bot
//     if (message.status == 'unconfirmed') {
//       // payment has been sent to the ethereum network, but is not yet confirmed
//       sendMessage(session, `Thanks for the payment! 🙏`);
//     } else if (message.status == 'confirmed') {
//       // handle when the payment is actually confirmed!
//     } else if (message.status == 'error') {
//       sendMessage(session, `There was an error with your payment!🚫`);
//     }
//   }
// }
//
// // STATES
//
// function welcome(session) {
//   sendMessage(session, `Hello Token!`)
// }
//
// function pong(session) {
//   sendMessage(session, `Pong`)
// }
//
// // example of how to store state on each user
// function count(session) {
//   let count = (session.get('count') || 0) + 1
//   session.set('count', count)
//   sendMessage(session, `${count}`)
// }
//
// function donate(session) {
//   // request $1 USD at current exchange rates
//   Fiat.fetch().then((toEth) => {
//     session.requestEth(toEth.USD(1))
//   })
// }
//
// // HELPERS
//
// function sendMessage(session, message) {
//   let controls = [
//     {type: 'button', label: 'Ping', value: 'ping'},
//     {type: 'button', label: 'Count', value: 'count'},
//     {type: 'button', label: 'Donate', value: 'donate'}
//   ]
//   session.reply(SOFA.Message({
//     body: message,
//     controls: controls,
//     showKeyboard: false,
//   }))
// }
