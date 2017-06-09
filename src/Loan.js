DAPP_ROOT = 'https://853fb367.ngrok.io'

class Period {
  constructor(type, length) {
    this.type = type;
    this.length = length;
  }
}

class Loan {
  constructor(tokenId, borrower, attestor, principal, interest, period, termLength, fundingTimelock) {
    this.tokenId = tokenId;
    this.borrower = borrower;
    this.attestor = attestor;
    this.principal = principal;
    this.interest = interest;
    this.period = period;
    this.termLength = termLength;
    this.fundingTimelock = fundingTimelock;
  }

  confirmationDappURL() {
    let url =  DAPP_ROOT + "?tokenId=" + this.tokenId + "&" +
                             "borrower=" + this.borrower + "&" +
                             "attestor=" + this.attestor + "&" +
                             "principal=" + this.principal + "&" +
                             "interest=" + this.interest + "&" +
                             "periodType=" + this.period.type + "&" +
                             "periodLength=" + this.period.length + "&" +
                             "termLength=" + this.termLength + "&" +
                             "fundingTimelock=" + this.fundingTimelock;
    return url;
  }
}

module.exports = { Loan, Period }
