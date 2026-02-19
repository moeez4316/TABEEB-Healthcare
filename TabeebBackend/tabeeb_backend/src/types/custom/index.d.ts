export {}; 

declare global {
  namespace Express {
    interface AdminContext {
      id?: string;
      username: string;
      name?: string;
      email?: string;
      role?: string;
      adminRole?: string;
      permissions?: string[];
      sessionId?: string;
      jwtId?: string;
      isSuperAdmin?: boolean;
      isAdmin?: boolean;
      mustChangePassword?: boolean;
      [key: string]: any;
    }

    interface Request {
      user?: {
        uid: string;
        role?: string;
        [key: string]: any;
      };
      admin?: AdminContext;
      body: any;
      headers: any;
    }
  }
}
