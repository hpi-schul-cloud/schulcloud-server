import { Algorithm } from 'jsonwebtoken';

export interface AuthGuardConfig {
	ADMIN_API__ALLOWED_API_KEYS: string[];
	JWT_PUBLIC_KEY: string;
	JWT_SIGNING_ALGORITHM: Algorithm;
	SC_DOMAIN: string;
}
