class State {
  constructor(fnMapping) {
    this.fnMapping = fnMapping;
  }

  action(session) {
    if ('action' in this.fnMapping)
      this.fnMapping.action(session);
    else
      console.log("State action is unimplemented");
  }

  onMessage(session, message) {
    if ('onMessage' in this.fnMapping)
      this.fnMapping['onMessage'](session, message);
    else
      this.action(session);
  }

  onCommand(session, command) {
    if ('onCommand' in this.fnMapping) {
      this.fnMapping.onCommand(session, command);
    } else {
      this.action(session);
    }
  }

  onPayment(session, message) {
    if ('onPayment' in this.fnMapping)
      this.fnMapping['onPayment'](session);
    else
      this.action(session);
  }

  onPaymentRequest(session, message) {
    if ('onPaymentRequest' in this.fnMapping)
      this.fnMapping['onPaymentRequest'](session);
    else
      this.action(session);
  }
}

module.exports = State
