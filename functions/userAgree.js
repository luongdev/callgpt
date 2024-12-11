async function userAgree(functionArgs) {
  console.log('userAgree', JSON.stringify(functionArgs));

  return JSON.stringify(functionArgs);
}

module.exports = userAgree;
