const Session = require('./lib/Session')
const Web3 = require('web3');
const StateEngine = require('./StateEngine')
const express = require('express')

class SessionServer {
  constructor(bot) {
    this.bot = bot;
    this.web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
    this.states = new StateEngine()
    this.app = express();

    this.app.get('/:userId/generateReceipt/:txHash', this.generateReceipt.bind(this));

    this.app.listen(80);
  }

  generateReceipt(req, res) {
    const txHash = req.params.txHash;
    const userId = req.params.userId;

    this.web3.eth.getTransaction(txHash, function(error, tx) {
      if (error) {
        console.log(error);
      } else {
          Session.retrieve(this.bot, userId, (session) => {
          if (session.get("paymentAddress") == tx.from &&
                session.get("state") == "confirmation") {
              this.states.transition(session, 'receipt')
          }
        })
      }
    }.bind(this));

    res.send(200);
  }
}

module.exports = SessionServer;
