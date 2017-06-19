const Session = require('./lib/Session')
const Web3 = require('web3');
const StateEngine = require('./StateEngine')
const express = require('express')
const http = require('http');
const https = require('https');
const fs = require('fs');
const Attestor = require('./Attestor.js');
const PayoutDaemon = require('./PayoutDaemon.js');
const Servicer = require('./Servicer.js');
const privateKey  = fs.readFileSync(__dirname + '/ssl/server.key', 'utf8');
const certificate = fs.readFileSync(__dirname + '/ssl/server.cert', 'utf8');
const credentials = {key: privateKey, cert: certificate};

HTTP_PORT = process.env["HTTP_PORT"];
HTTPS_PORT = process.env['HTTPS_PORT']
WEB3_PROVIDER = process.env['WEB3_PROVIDER'];

class SessionServer {
  constructor(bot) {
    this.bot = bot;
    this.web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER));
    this.states = new StateEngine()
    this.app = express();

    this.servicer = new Servicer(this.web3);
    this.attestor = new Attestor(this.web3);
    this.payoutDaemon = new PayoutDaemon();

    this.loanFunded = this.loanFunded.bind(this);

    const syncState = this.web3.eth.isSyncing(function(error, sync) {
      if (error) {
        console.log(error);
      } else {
        if(sync === true) {
           web3.reset(true);
        } else if(sync) {
           console.log("Syncing: " + sync.currentBlock);
        } else {
            console.log("Initializing listeners");
            this.payoutDaemon.init({
              onLoanFunded: this.loanFunded
            });
        }
      }
    });

    if (!syncState.lastSyncState) {
      this.payoutDaemon.init({
        onLoanFunded: this.loanFunded
      });
    }

    this.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    this.app.get('/:userId/generateReceipt/:txHash', this.generateReceipt.bind(this));
    this.app.get('/loanFunded/:tokenId', this.loanFunded.bind(this));
    this.app.get('/:userId/:verified', this.riskAssessmentDone.bind(this));

    this.http = http.createServer(this.app).listen(HTTP_PORT || 80);
    this.https = https.createServer(credentials, this.app).listen(HTTPS_PORT || 443);
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

  loanFunded(err, result) {
    if (err) {
      return console.log(err);
    }

    const tokenId = this.bot.client.store.getKey('ethAddress-' + result.args._borrower);
    this.bot.client.store.setKey('uuid-' + result.args._uuid, tokenId);

    this.servicer.scheduleRepaymentReminders(result.args._uuid, tokenId, this.bot);

    Session.retrieve(this.bot, tokenId, (session) => {
      if (session) {
        this.states.transition(session, 'loanFunded');
      }
    })
  }
}

module.exports = SessionServer;
