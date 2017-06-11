const Session = require('./lib/Session')
const Web3 = require('web3');
const StateEngine = require('./StateEngine')
const express = require('express')
const https = require('https');
const fs = require('fs');

const privateKey  = fs.readFileSync(__dirname + '../ssl/server.key', 'utf8');
const certificate = fs.readFileSync(__dirname + '../ssl/server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

PORT = process.env["PORT"];

class SessionServer {
  constructor(bot) {
    this.bot = bot;
    this.web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
    this.states = new StateEngine()
    this.app = express();
    this.https = https.createServer(credentials, this.app);


    this.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    this.app.get('/:userId/generateReceipt/:txHash', this.generateReceipt.bind(this));

    this.app.get('/:userId/:verified', this.riskAssessmentDone.bind(this))
    this.https.listen(PORT || 80);
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
    console.log("I am here now");

    Session.retrieve(this.bot, userId, (session) => {
      if (session) {
          session.set("verified", true);
          this.states.transition(session, 'riskAssessmentComplete')
      }
    })

  }
}

module.exports = SessionServer;
