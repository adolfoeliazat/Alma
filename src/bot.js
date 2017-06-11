const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const StateEngine = require('./StateEngine')
const states = new StateEngine()
const SessionServer = require('./SessionServer');
const Mixpanel = require('mixpanel');
const mixpanel = Mixpanel.init('b34b8795ac94c94e23702f278b3193f5');

let bot = new Bot();
let sessionServer = new SessionServer(bot);

function setState(session, state) {
  console.log("I'm here")
  session.set('state', state);
  session.set('startTimestamp', Date.now());
}

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      mixpanel.track("event-init", {
        tokenId: session.get("address")
      });
      break
    case 'Message':
      mixpanel.track("event-message", {
        tokenId: session.get("address"),
        message: message.body,
        state: session.get("state")
      });

      console.log("Payment Address: " + session.get("paymentAddress"));
      console.log("UserId: " + session)
      const twoHours = 2 * 60 * 60 * 1000;
      if (!session.get("state") || Date.now() - session.get('startTimestamp') > twoHours)
        setState(session, 'welcome');

      // Debug functionality
      if (message.body[0] == '/')
        setState(session, message.body.substring(1))

      console.log(session.get('state'));
      states.getState(session).onMessage(session, message)
      break
    case 'Command':
      mixpanel.track("event-command", {
        tokenId: session.get("address"),
        value: message.value,
        state: session.get("state")
      });
      states.getState(session).onCommand(session, message)
      break
    case 'Payment':
      mixpanel.track("event-payment", {
        tokenId: session.get("address"),
        state: session.get("state")
      });
      states.getState(session).onPayment(session, message)
      break
    case 'PaymentRequest':
      mixpanel.track("event-payment-request", {
        tokenId: session.get("address")
      })
      states.getState(session).onPaymentRequest(session)
      break
  }
}
