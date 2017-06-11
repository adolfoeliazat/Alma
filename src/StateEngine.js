RAA_ROOT = process.env['OZ_ROOT_PATH'];

const State = require('./State')
const SOFA = require('sofa-js')
const { Loan, Period } = require('./Loan');
const request = require('request');
const currency = require('currency-formatter');
const Mixpanel = require('mixpanel');


// temporary -- hardcoding loan terms
function loanTerms(session, packageChoice) {
  const principal = session.get('principal')
  const packages = {
    "A": "Principal: " + currency.format(principal, { code: 'USD' }) + "\nInterest " +
          "Rate: 13%\nTerm: 1 Week\nWeekly Repayments\nYou get " + currency.format(principal, { code: 'USD' }) +
          " now. In 1 week you owe " + currency.format(1.13*principal, { code: 'USD' }),
    "B": "Principal: " +  currency.format(principal, { code: 'USD' }) + "\nInterest " +
         "Rate: 22.5%\nTerm: 2 Weeks\nWeekly Repayments\nYou get " + currency.format(principal, { code: 'USD' }) +
         " now. In two weeks, you owe " + currency.format(1.225*principal, { code: 'USD' }) + " for a " +
         "total of " + currency.format(1.225*principal, { code: 'USD' }),
    "C": "Principal: " +  currency.format(principal, { code: 'USD' }) + "\nInterest " +
         "Rate: 53%\nTerm: 3 Weeks\nWeekly Repayments\nYou get " + currency.format(principal, { code: 'USD' }) +
         ". In three weeks, you owe " + currency.format(1.53*principal, { code: 'USD' }) + " for a " +
         "total of " + currency.format(1.53*principal, {code: 'USD'})
  }

  return packages[packageChoice];
}

class StateEngine {
  constructor() {
    this.mixpanel = Mixpanel.init('b34b8795ac94c94e23702f278b3193f5');
    this.stateMapping = {
      /*
        Welcome to Dharma!  I’m a bot -- beep bloop.  Would you like to apply for a loan?
      */
      welcome: new State({
        action: (session) => {
          session.reply(SOFA.Message({
            body: "Welcome to Dharma!\nI’m a bot -- beep bloop.\n\nWould you like to apply for a loan?",
            controls: [{type: 'button', label: 'Yes!', value: 'yes'}],
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
            body: "How much money do you need? (in USD) \n \nNote: maximum cap for first-time users is $50",
            showKeyboard: true
          }));
        },

        onMessage: (session, message) => {
          if (isNaN(message.body)) {
            session.reply(SOFA.Message({
              body: "Please reply with only a number",
              showKeyboard: true
            }));
          } else {
            const principal = Number(message.body);
            if (principal > 50) {
              session.reply(SOFA.Message({
                body: "Maximum cap for first-time users is $50",
                showKeyboard: true
              }));
            } else {
              session.set('principal', principal);
              this.transition(session, 'riskAssessorsIntro');
            }
          }
        }
      }),

      riskAssessorsIntro: new State({
        action: (session) => {
          session.reply("Excellent -- I’m happy to walk you through the loan application process");
          session.reply("First, I’d like to learn a bit more about you…");
          session.reply(SOFA.Message({
            body: "I’m going to show you a list of Risk Assessors I trust " +
              "-- for a small fee, they’ll vouch for your trustworthiness and help " +
               "me get an idea of what interest rate you should get.",
            showKeyboard: false,
            controls: [
              {type: 'button', label: 'Got it', value: 'got-it'},
              {type: 'button', label: "What's a Risk Assessor?", value: 'question'}
            ]
          }));
        },

        onCommand: (session, command) => {
          if (command.value == 'question') {
            session.reply("Sometimes, borrowers are either unwilling or unable to" +
              " pay back a loan.  A risk assessor is a trusted, centralized entity" +
              " that, for a small, fixed fee, looks at a borrower’s credit history" +
              " both in and outside the Dharma network and predicts the likelihood" +
              " that a borrower will pay back the loan.");
            session.reply("Borrowers like yourself can apply for a loan with any " +
              "risk assessor of their choice in the risk assessment marketplace. " +
              " The higher your risk-assessor’s rating, the more investors trust " +
              "them, meaning your loan is more likely to get funded.");
            session.reply("Don’t worry, though -- you won’t get charged until your" +
              " loan is fully funded and the money is in your hands.");
            this.transition(session, "riskAssessorMenu");
          } else if (command.value == 'got-it') {
            this.transition(session, "riskAssessorMenu");
          }
        }
      }),

      riskAssessorMenu: new State({
        action: (session) => {
          session.reply("Please choose the Risk Assessor you’d like to work with");
          session.reply(SOFA.Message({
            body: "Note: You will only be charged automatically once your loan is fully funded",
            showKeyboard: false,
            controls: [
              {
                type: 'group',
                label: 'Risk Assessor - Rating - Fee',
                controls: [
                  {type: "button", label: "Dharma Risk Assessment Ltd. - A --$0.5", value: 'raa-english'},
                  {type: "button", label: "आधार जोखिम आकलन (OFFLINE)- BB - $0.35", value: 'raa-hindi'},
                  {type: "button", label: "Aadhaar Risk (OFFLINE) - C - $0.15", value: 'raa-hebrew'}
                ]
              },
              {
                type: 'group',
                label: 'FAQ',
                controls: [
                  {type: "button", label: "What is a Risk Assessor?", value: 'faq-what-is-raa'},
                  {type: "button", label: "What does a Risk Assessor’s rating mean?", value: 'faq-raa-rating'},
                  {type: "button", label: "Other", value: 'faq-other'}
                ]
              }
            ]
          }));
        },

        onCommand: (session, command) => {
          switch (command.value) {
            case 'raa-english':
              session.reply("Dharma Risk Assessment Ltd. will message you " +
                "shortly with further instructions.  Tap 'Recent' to reach the recent messages screen -- they may have messaged you already!")
              var url = RAA_ROOT + "/" + session.get("address") + "/" + session.get("paymentAddress");
              console.log("Requesting from " + url);
              request(url, function(error, response, body) {
                console.log(error);
              });
              break;
            case 'raa-hindi':
              session.reply("आधार जोखिम आकलन is offline right now.")
              this.transition(session, 'riskAssessorMenu')
              break;
            case 'raa-hebrew':
              session.reply("Aadhaar Risk is offline right now.")
              this.transition(session, 'riskAssessorMenu')
              break;
            case 'faq-what-is-raa':
              session.reply("Sometimes, borrowers are either unwilling or " +
                "unable to pay back a loan.  A risk assessor is a trusted, " +
                "centralized entity that, for a small, fixed fee, looks at a " +
                "borrower’s credit history both in and outside the Dharma " +
                "network and predicts the likelihood that a borrower will pay back the loan.")
              this.transition(session, 'riskAssessorMenu')
              break;
            case 'faq-raa-rating':
              session.reply("The higher your risk-assessor’s rating, the more " +
                "investors trust them, meaning your loan is more likely to get " +
                "funded.  Higher-rated risk-assessors, however, will often charge higher fees.")
              this.transition(session, 'riskAssessorMenu')
              break;
            case 'faq-other':
              session.reply("Please enter your question, and we’ll get back to you as soon as possible.")
              this.transition(session, 'riskAssessorMenu');
              break;
          }
        }
      }),

      riskAssessmentComplete: new State({
        action: (session) => {
          if (session.get("verified")) {
            const principal = session.get("principal");

            session.reply("Congratulations -- you loan’s been approved by " +
              "Dharma Risk Assessment Ltd.");

            this.transition(session, 'chooseLoanPackage');
          } else {
            session.reply("It seems Dharma Risk Assessment denied your loan request.  Don’t worry -- you can always try to apply again with any risk assessor (including Dharma Risk Assessment).  Which risk assessor would you like to work with?");
            this.transition(session, "riskAssessorMenu");
          }
        }
      }),

      chooseLoanPackage: new State({
        action: (session) => {
          session.reply("Given the risk assessment we’ve " +
            "been given, you have 3 loan packages to choose from:")
          session.reply("Package A:")
          session.reply(loanTerms(session, "A"))
          session.reply("Package B:")
          session.reply(loanTerms(session, "B"))
          session.reply("Package C:")
          session.reply(loanTerms(session, "C"))
          session.reply(SOFA.Message({
            body: "Which package would you like?",
            showKeyboard: false,
            controls: [
              {
                type: 'group',
                label: 'Package',
                controls: [
                  {type: "button", label: "Package A", value: 'package-a'},
                  {type: "button", label: "Package B", value: 'package-b'},
                  {type: "button", label: "Package C", value: 'package-c'}
                ]
              },
              { type: 'button', label: 'Cancel', value: 'cancel' }
            ]
          }));
        },

        onCommand: (session, command) => {
          if (command.value == 'package-a') {
            session.set("package", "A")
            this.transition(session, "confirmation")
          } else if (command.value == 'package-b') {
            session.set("package", "B")
            this.transition(session, "confirmation")
          } else if (command.value == 'package-c') {
            session.set("package", "C")
            this.transition(session, "confirmation")
          } else if (command.value == 'cancel') {
            session.reply("Thank you for your time!")
            this.transition(session, "feedbackSurvey")
          }
        }
      }),

      confirmation: new State({
        action: (session) => {
          const period = new Period('Weekly', 1);
          const loanPackage = session.get("package");
          const principal = session.get("principal");

          let loan = null;

          if (loanPackage == 'A') {
             loan = new Loan(session.get("address"),
                              session.get("paymentAddress"),
                              '0x2987aa227df48d4891b3fe667c7a0c463f8857b1',
                              principal, 0.13*principal, period, 1,
                              Date.now() + (60 * 60 * 1000 * 24 * 30));
          } else if (loanPackage == 'B') {
             loan = new Loan(session.get("address"),
                              session.get("paymentAddress"),
                              '0x2987aa227df48d4891b3fe667c7a0c463f8857b1',
                              principal, 0.225*principal, period, 2,
                              Date.now() + (60 * 60 * 1000 * 24 * 30));
          } else if (loanPackage == 'C') {
             loan = new Loan(session.get("address"),
                              session.get("paymentAddress"),
                              '0x2987aa227df48d4891b3fe667c7a0c463f8857b1',
                              principal, 0.53*principal, period, 3,
                              Date.now() + (60 * 60 * 1000 * 24 * 30));
          }


          session.reply("You’ve chosen Option " + session.get("package") +
            ". Now, before we move forward, it’s important that you understand…")
          session.reply("Dharma will send you reminders in the days leading " +
            "up to and days of your loan’s repayment dates, and you will be " +
            "able to make loan repayments directly through the Token " +
            "app.");
            try {
              session.reply(SOFA.Message({
                body: "If you neglect to meet your repayment due dates, it " +
                  "is very unlikely that you will be able to get a loan on Dharma " +
                  "in the future.  Conversely, if you meet your repayment due dates " +
                  "in full, you will be able to take out larger loans at lower " +
                  "interest rates in the future.",
                showKeyboard: false,
                controls: [
                  { type: 'button', label: 'I understand.', action: 'Webview::' + loan.confirmationDappURL() }
                ]
              }))
            } catch (error) {
              console.log(error);
            }

        },

        // Confirmation takes user out into the dapp in order to sign the
        // loan contract.
        onCommand: (session, command) => {
          if (command.value == 'yes') {
            this.transition(session, 'feedbackSurveyQ1');
          } else if (command.value == 'no') {
            session.reply("Ok.  Have a nice day!");
            session.set(state, null);
          }
        }
      }),

      receipt: new State({
        action: (session) => {
          session.reply("Your loan request has been broadcasted out to the " +
            "Dharma network -- you can see the transaction here: https://ropsten.etherscan.io/tx/" +
            session.get("txHash") + ". We’ll send you a message when " +
             "your loan has been fully funded and the loan principal will be " +
             "automatically sent to your Token wallet.");
          session.reply("Thank you!")
          session.reply(SOFA.Message({
            body: "Would you mind taking a quick feedback survey?  It’s only 3 questions long, and should take no more than a minute.",
            showKeyboard: false,
            controls: [
              { type: 'button', label: 'Sure', value: 'yes' },
              { type: 'button', label: 'No thanks', value: 'no' }
            ]
          }))
        },

        onCommand: (session, command) => {
          if (command.value == 'yes') {
            this.transition(session, 'feedbackSurveyQ1');
          } else if (command.value == 'no') {
            session.reply("No problem.")
            this.transition(session, "summary");
          }
        }
      }),

      feedbackSurveyQ1: new State({
        action: (session) => {
          session.reply("On a scale of 1 to 10, how likely would you be to recommend Dharma to a friend?")
        },

        onMessage: (session, message) => {
          if (isNaN(message.body)) {
            session.reply(SOFA.Message({
              body: "Please reply with only a number",
              showKeyboard: true
            }));
            this.transition(session, 'feedbackSurveyQ1');
          } else {
            // TODO fill in feedback collection
            this.transition(session, 'feedbackSurveyQ2');
          }
        }
      }),

      feedbackSurveyQ2: new State({
        action: (session) => {
          session.reply("What could we do better in order to earn a 9 or a 10 on the previous question?")
        },

        onMessage: (session, message) => {
          // TODO fill in feedback collection
          this.transition(session, 'feedbackSurveyQ3')
        }
      }),

      feedbackSurveyQ3: new State({
        action: (session) => {
          session.reply("Any general feedback / suggestions?");
        },

        onMessage: (session, message) => {
          session.reply("Noted.  That's all -- thanks again.")
          session.set("state", null);
        }
      }),

      summary: new State({
        action: (session) => {
          session.reply("This has been a proof-of-concept of the borrower \
              experience on a Dharma Loan client.  If you're interested in \
              learning more about the Dharma Protocol, head to dharma.io and \
              have a look around -- we'd love to hear your thoughts and feedback!")
          session.set("state", null);
        }
      })
    }
  }

  getState(session) {
    return this.stateMapping[session.get('state')];
  }

  transition(session, state) {
    session.set("state", state);
    this.stateMapping[state].action(session);
    this.mixpanel.track("token-state-" + state, {
      tokenId: session.get("address")
    })
  }
}

module.exports = StateEngine
