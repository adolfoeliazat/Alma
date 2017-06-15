LOAN_CONTRACT_ADDR = process.env['LOAN_CONTRACT_ADDR'];
WEB3_PROVIDER = process.env['WEB3_PROVIDER'];
DEFAULT_ACCOUNT = process.env['DEFAULT_ACCOUNT']

const Web3 = require('web3');
const fs = require('fs');
const abi = JSON.parse(fs.readFileSync(__dirname + '/contracts/Loan.abi', 'utf8'));
const Attestor = require('./Attestor.js');

class PayoutDaemon {
  constructor() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER));
    this.web3.defaulAccount = DEFAULT_ACCOUNT;
    this.contract = this.web3.eth.contract(abi).at(LOAN_CONTRACT_ADDR);
    this.attestor = new Attestor(this.web3);

    this.loanCreatedEvent = this.contract.LoanCreated({ fromBlock: 'latest' });
    this.loanAttestedEvent = this.contract.Attested({ fromBlock: 'latest' });
    this.loanTermBeginEvent = this.contract.LoanTermBegin({ fromBlock: 'latest' });
  }

  init(callbacks={}) {
    this.loanCreatedEvent.watch(callbacks['onLoanCreated'] || this.onLoanCreated);
    this.loanAttestedEvent.watch(callbacks['onLoanAttested'] || this.onLoanAttested);
    this.loanTermBeginEvent.watch(callbacks['onLoanTermBegin'] || this.onLoanFunded);
  }

  onLoanCreated(error, result) {
    if (error) {
      console.log(error);
    } else {
      this.attestToLoan(result.args._uuid);
    }
  }

  onLoanAttested(error, result) {
    if (error) {
      console.log(error);
    } else {
      const principal = this.contract.getPrincipal.call(results.args._uuid);
      this.fundLoan(result.args._uuid, { value: principal, gas: 1000000 }, function(err, tx) {
        if (err) {
          console.log(err);
        } else {
          console.log("Funded Loan: " + tx);
        }
      });
    }
  }

  attestToLoan(uuid) {
    this.attestor.getAttestationCommitment(uuid, function(err, commitment) {
      if (err) {
        console.log(err);
      } else {
        this.contract.attest(uuid, commitment, function (error, result) {
          if (error) {
            console.log(error);
          } else {
            console.log("Attested to loan at UUID " + uuid);
          }
        })
      }
    });
  }

  onLoanTermBegin(error, result) {
    // UNIMPLEMENTED
  }
}

module.exports = PayoutDaemon;
