const State = require('./State')
const SOFA = require('sofa-js')

class StateEngine {
  constructor() {
    this.stateMapping = {
      /*
        Welcome to Dharma!  I’m a bot -- beep bloop.  Would you like to apply for a loan?
      */
      welcome: new State({
        action: (session) => {
          console.log('here')
          let controls = [
            {type: 'button', label: 'Yes!', value: 'yes'}
          ];
          session.reply(SOFA.Message({
            body: "Welcome to Dharma!\nI’m a bot -- beep bloop.\n\nWould you like to apply for a loan?",
            controls: controls,
            showKeyboard: false
          }));
        },

        onCommand: (session, command) => {
          if (command.value == 'yes') {
            this.transition(session, 'howMuchMoney')

          }
        }
      }),

      howMuchMoney: new State({
        action: (session) => {
          session.reply(SOFA.Message({
            body: "How much money do you need? (in USD) \n \nNote: maximum cap for first-time users is $10",
            showKeyboard: true
          }));
        }
        //
        // onMessage: (session, message) => {
        //   if (isNaN(message.body))
        //     session.reply(SOFA.Message({
        //       body: "Please reply with only a number",
        //       showKeyboard: true
        //     }));
        // }
      })

    }
  }

  getState(session) {
    return this.stateMapping[session.get('state')];
  }

  transition(session, state) {
    session.set("state", state);
    this.stateMapping[state].action(session);
  }
}

module.exports = StateEngine
