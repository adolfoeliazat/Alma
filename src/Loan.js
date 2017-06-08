DAPP_ROOT = 'http://48e87c01.ngrok.io'

class Period {
  constructor(type, length) {
    this.type = type;
    this.length = length;
  }
}

class Loan {
  constructor(borrower, attestor, principal, interest, period, termLength, fundingTimelock) {
    this.borrower = borrower;
    this.attestor = attestor;
    this.principal = principal;
    this.interest = interest;
    this.period = period;
    this.termLength = termLength;
    this.fundingTimelock = fundingTimelock;
  }

  confirmationDappURL() {
    const url =  DAPP_ROOT + "?" + "borrower=" + this.borrower + "&" +
                             "attestor=" + this.attestor + "&" +
                             "principal=" + this.principal + "&" +
                             "interest=" + this.interest + "&" +
                             "periodType=" + this.period.type + "&" +
                             "periodLength=" + this.period.length + "&" +
                             "termLength=" + this.termLength + "&" +
                             "fundingTimelock=" + this.fundingTimelock;
    console.log(url);
    return url;
  }
}

module.exports = { Loan, Period }
