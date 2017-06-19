const scheduler = require('node-schedule');
const Fiat = require('./lib/Fiat');
const SOFA = require('sofa-js')
const currency = require('currency-formatter');
const fs = require('fs');
const abi = JSON.parse(fs.readFileSync(__dirname + '/contracts/Loan.abi', 'utf8'));

LOAN_CONTRACT_ADDR = process.env["LOAN_CONTRACT_ADDR"]

const PERIOD_TYPES = [
  'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
]

class Servicer {
  constructor(web3) {
    this.web3 = web3;
    this.contract = this.web3.eth.contract(abi).at(LOAN_CONTRACT_ADDR);
  }

  scheduleRepaymentReminders(uuid, tokenId, bot) {
    const schedule = this._getRepaymentSchedule(uuid);
    let now = new Date();
    schedule.forEach(function(repayment) {
      console.log("Scheduling repayment of " + repayment.owed + " on " + repayment.date)
      scheduler.scheduleJob(repayment.date, function() {
        Fiat.fetch().then((toEth) => {
          bot.client.send(tokenId, SOFA.PaymentRequest({
            body: "You owe " + currency.format(repayment.owed, { currency: 'USD' })
              + " for a loan you took out on " + now.toISOString().slice(0,10).replace(/-/g,"/") +
              ".  Please pay the amount owed in full by the end of the day.",
            amount: web3.toHex(web3.toWei(toEth.USD(repayment.owed), 'ether')),
            destinationAddress: LOAN_CONTRACT_ADDR
          }));
        })
      })
    })
  }

  _getRepaymentSchedule(uuid) {
    const principal = this.contract.getPrincipal.call(uuid);
    const interest = this.contract.getInterest.call(uuid);
    const totalOwed = principal + interest;
    const periodType = this.contract.getPeriodType.call(uuid);
    const periodLength = this.contract.getPeriodLength.call(uuid);
    const termLength = this.contract.getTermLength.call(uuid);
    const owedPerPeriod = totalOwed / termLength;

    let schedule = []
    for (let i = 1; i <= termLength; i++) {
      let repayment = {
        owed: owedPerPeriod,
        date: new Date()
      }
      switch (PERIOD_TYPES[periodType]) {
        case 'DAILY':
          repayment.date.setDate(repayment.date.getDate() + i * periodLength)
          break;
        case 'WEEKLY':
          repayment.date.setDate(repayment.date.getDate() + i * periodLength * 7)
          break;
        case 'MONTHLY':
          repayment.date.setMonth(repayment.date.getMonth() + i * periodLength);
          break;
        case 'YEARLY':
          repayment.date.setYear(repayment.date.setYear() + i * periodLength);
          break;
      }
      schedule.push(repayment);
    }

    return schedule;
  }
}

module.exports = Servicer;
