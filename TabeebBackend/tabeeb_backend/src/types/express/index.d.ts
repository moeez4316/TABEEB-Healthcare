export {}; 

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role?: string;
        [key: string]: any;
      };
      body: any;
      headers: any;
    }
  }
}
