export interface AuthGuardConfig {
	ADMIN_API__ALLOWED_API_KEYS: string[];
	JWT_AUD: string;
	JWT_LIFETIME: string;
	AUTHENTICATION: string;
}
