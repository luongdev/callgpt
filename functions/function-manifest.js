// create metadata for all the available functions to pass to completions API
const tools = [
  {
    type: 'function',
    function: {
      name: 'getAgentName',
      say: 'Hello, this is {{agentName}} calling you from Luuzio Finance Company. I understand that you have a financial contract with our company. Please confirm your name and IC number. \n To improve service quality, we will record this call',
      sync: true,
      description: 'Get agentName and set to conversation.',
      parameters: {
        type: 'object',
        properties: {
          callSid: {
            type: 'string',
            description: 'id of the call.',
          },
        },
        required: ['callSid'],
      },
      returns: {
        type: 'object',
        properties: {
          agentName: {
            type: 'string',
            description: 'Name of agent.'
          }
        }
      }
    },
  },
  {
    type: 'function',
    function: {
      name: 'setUserInfo',
      sync: true,
      say: 'Mr./Madam {{name}} with IC number {{icNum}} confirm that the information and documents provided and signed, including the employer\'s confirmation, are valid and true.' +
          'Your financing amounting to {{amount}} has been approved and the financing cost to be borne by Mr./Mrs. is {{amountLia}} ' +
          'Advance financing has been paid to you via the Al-Qardhul Hassan agreement amounting to {{advAmount}} and initial settlement to a third party of {{setAmount}} ' +
          'Accordingly, the remaining financing that you will receive is {{amountReceived}} with monthly payments of {{monthlyPayments}} for a period of 10 years\n' +
          '\n' +
          'Do you agree?',
      description: 'When the user provides information about the name, number of IC call the setUserInfo function, MUST collect both ["name" and "IC Number"] you can try to ask user maximum 3 times, if cannot found ["name" or "IC number"], call hangupCall function',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'detect and set the name of the user',
          },
          icNum: {
            type: 'string',
            description: 'detect and set the IC number of the user',
          },
        },
        required: ['name', 'icNum'],
      }
    },
  },
  {
    type: 'function',
    function: {
      sync: true,
      name: 'userAgree',
      say: 'Thank you Mr/Madam {{name}} for confirming. Have a nice day!',
      description: 'Goodbye and call hangupCall function',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'name of the user saved in the setUserInfo function',
          },
          agree: {
            type: 'boolean',
            description: 'The user agree or not',
          }
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hangupCall',
      say: '',
      description: 'Goodbye and call hangupCall function',
      parameters: {
        type: 'object',
        properties: {
          callSid: {
            type: 'string',
            description: 'The callSid of the call',
          }
        },
        required: ['name'],
      },
    },
  },
];

module.exports = tools;
