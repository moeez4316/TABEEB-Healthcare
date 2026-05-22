const payload = {
  "amount":"750.00",
  "currency":"PKR",
  "fee":"24.58",
  "intent":"CYBERSOURCE",
  "merchant_api_key":"sec_aeb83c85-2866-4a47-a924-99374c98b0fb",
  "net":"725.42",
  "notification_id":"D887T5TF09HC73BUQGBG",
  "payment_metadata":[
    {
      "created_at":"2026-05-22T16:04:39Z",
      "meta_key":"order_id",
      "meta_value":"cmph3r9op0003ufccm3rx2iwo",
      "payment_notification_id":"D887T5TF09HC73BUQGC0",
      "token":"D887T5TF09HC73BUQGCG",
      "updated_at":"2026-05-22T16:05:47Z"
    }
  ],
  "reference":"106244",
  "state":"PAID",
  "token":"D887T5TF09HC73BUQGC0",
  "tracker":"track_4f22751c-5aa9-4018-b6ef-83efea709b76",
  "user":"tabeebpatient@gmail.com"
};

async function testWebhook() {
  try {
    const res = await fetch('https://expediter-distill-freely.ngrok-free.dev/api/safepay/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sfpy-signature': 'dummy'
      },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch(e) {
    console.error(e);
  }
}
testWebhook();
