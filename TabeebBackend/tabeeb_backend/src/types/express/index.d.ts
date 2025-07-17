export {}; 
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        [key: string]: any;
      };
      file?: Multer.File;
      body: any;
      headers: any;
    }
  }
}
