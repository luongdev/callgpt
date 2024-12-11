async function setUserInfo(functionArgs) {
  console.log('setUserInfo', JSON.stringify(functionArgs));


  const a = { ...functionArgs,
    amount: '6900 USD',
    amountLia: '9600 USD',
    advAmount: '9600 USD',
    setAmount: '9600 USD',
    amountReceived: '120000 USD',
    monthlyPayments: '1000 USD'
  };

  return JSON.stringify(a);
}

module.exports = setUserInfo;
