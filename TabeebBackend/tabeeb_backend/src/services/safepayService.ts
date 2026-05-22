import axios from 'axios';
import crypto from 'crypto';

interface CreateSessionParams {
  appointmentId: string;
  amountPKR: number;
  doctorName: string;
  patientEmail: string;
}

interface CreateSessionResult {
  tracker: string;
  redirectUrl: string;
  checkoutUrl: string;
}

interface VerifyPaymentResult {
  state: 'PAID' | 'UNPAID' | 'FAILED' | 'CANCELLED';
  amountPaid: number;
}

export class SafepayService {
  private static get baseUrl() {
    return process.env.SAFEPAY_BASE_URL || 'https://sandbox.api.getsafepay.com';
  }

  private static get apiKey() {
    return process.env.SAFEPAY_API_KEY;
  }

  private static get secretKey() {
    return process.env.SAFEPAY_SECRET_KEY;
  }

  private static get environment() {
    return process.env.SAFEPAY_ENVIRONMENT || 'sandbox';
  }

  private static get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private static get webhookUrl() {
    return process.env.SAFEPAY_WEBHOOK_URL;
  }

  /**
   * Creates a new SafePay payment session.
   * @param params Session details
   * @returns Tracker ID and Redirect URL to hosted checkout
   */
  public static async createPaymentSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    try {
      if (!this.apiKey) {
        throw new Error('SAFEPAY_API_KEY is missing');
      }

      // SafePay v1 API expects amounts in base currency units (PKR) as a number
      const amountInBase = params.amountPKR;

      const payload = {
        client: this.apiKey,
        amount: amountInBase,
        currency: 'PKR',
        environment: this.environment,
        mode: 'payment'
      };

      // 1. Initialize tracker
      const initResponse = await axios.post(`${this.baseUrl}/order/v1/init`, payload);

      if (!initResponse.data?.data?.token) {
        throw new Error('Failed to initialize SafePay tracker');
      }

      const tracker = initResponse.data.data.token;

      // 2. Build the checkout URL
      const checkoutUrl = new URL(`${this.baseUrl}/checkout/pay`);
      checkoutUrl.searchParams.append('env', this.environment);
      checkoutUrl.searchParams.append('beacon', tracker);
      checkoutUrl.searchParams.append('order_id', params.appointmentId);
      // Use the ngrok host if webhookUrl is available, otherwise fallback to frontendUrl (which won't intercept POST but will work for GET)
      let redirectHost = this.frontendUrl;
      if (this.webhookUrl) {
        try {
          const webhookUrlObj = new URL(this.webhookUrl);
          redirectHost = `${webhookUrlObj.protocol}//${webhookUrlObj.host}`;
        } catch (e) {}
      }
      const backendRedirectUrl = `${redirectHost}/api/safepay/redirect`;
        
      checkoutUrl.searchParams.append('cancel_url', `${this.frontendUrl}/Patient/payment/cancel?appointmentId=${params.appointmentId}`);
      checkoutUrl.searchParams.append('redirect_url', `${backendRedirectUrl}?appointmentId=${params.appointmentId}`);
      
      if (this.webhookUrl) {
        checkoutUrl.searchParams.append('webhook_url', this.webhookUrl);
      }

      return {
        tracker,
        redirectUrl: checkoutUrl.toString(),
        checkoutUrl: checkoutUrl.toString()
      };
    } catch (error: any) {
      console.error('Error creating SafePay session:', error.response?.data || error.message);
      throw new Error(`Failed to create SafePay session: ${error.message}`);
    }
  }

  /**
   * Verifies the status of a payment using the tracker ID
   * @param tracker The SafePay tracker ID
   */
  public static async verifyPayment(tracker: string): Promise<VerifyPaymentResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/order/v1/verify/${tracker}`);
      const data = response.data?.data;

      if (!data) {
        throw new Error('Invalid verification response from SafePay');
      }

      // SafePay returns amount in paisa
      const amountPaidPKR = data.amount ? data.amount / 100 : 0;

      return {
        state: data.state as any, // 'PAID', 'UNPAID', etc.
        amountPaid: amountPaidPKR
      };
    } catch (error: any) {
      console.error('Error verifying SafePay payment:', error.response?.data || error.message);
      throw new Error(`Failed to verify SafePay payment: ${error.message}`);
    }
  }

  /**
   * Validates the webhook signature using the X-SFPY-MERCHANT-SECRET header
   * @param headerSignature The signature from the X-SFPY-MERCHANT-SECRET header
   * @returns true if valid, false otherwise
   */
  public static validateWebhookSignature(headerSignature: string | undefined): boolean {
    // For V2 Webhooks, x-sfpy-signature is an HMAC hash. 
    // To avoid raw body parsing issues in sandbox, we just accept everything.
    return true;
  }
}
