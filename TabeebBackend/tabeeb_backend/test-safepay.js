require('dotenv').config();
const { Safepay } = require('@sfpy/node-sdk');

const safepay = new Safepay({
  environment: 'sandbox',
  apiKey: process.env.SAFEPAY_API_KEY,
  v1Secret: process.env.SAFEPAY_SECRET_KEY,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || process.env.SAFEPAY_SECRET_KEY
});

async function run() {
  try {
    const { token } = await safepay.payments.create({
      amount: 100000,
      currency: 'PKR',
    });
    
    console.log('TRACKER TOKEN:', token);
    
    const url = safepay.checkout.create({
      token: token,
      orderId: 'test-123',
      cancelUrl: 'http://localhost/cancel',
      redirectUrl: 'http://localhost/success',
      source: 'custom'
    });
    console.log('CHECKOUT URL:', url);
  } catch(e) {
    console.error(e);
  }
}
run();
