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

    this.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    this.app.get('/:userId/generateReceipt/:txHash', this.generateReceipt.bind(this));

    this.app.get('/:userId/:verified', this.riskAssessmentDone.bind(this))
    this.app.listen(80);
  }

  generateReceipt(req, res) {
    const txHash = req.params.txHash;
    const userId = req.params.userId;
    console.log("Hello world!");

    this.web3.eth.getTransaction(txHash, function(error, tx) {
      if (error) {
        console.log(error);
      } else {
          Session.retrieve(this.bot, userId, (session) => {
            if (session.get("paymentAddress") == tx.from &&
                  session.get("state") == "confirmation") {
                session.set("txHash", txHash);
                this.states.transition(session, 'receipt')
            }
        })
      }
    }.bind(this));

    res.sendStatus(200);
  }

  riskAssessmentDone(req, res) {
    const userId = req.params.userId;
    const verified = req.params.verified == 'true';

    if (req.hostname != 'oz.dharma.io')
      console.log("fraudulent!")
      res.send(500);
      return;

    Session.retrieve(this.bot, userId, (session) => {
      if (session) {
          session.set("verified", verified);
          this.states.transition(session, 'riskAssessmentComplete')
      }
    })

  }
}

module.exports = SessionServer;
