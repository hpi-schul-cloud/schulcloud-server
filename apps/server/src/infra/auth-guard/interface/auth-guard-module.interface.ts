import { Algorithm } from 'jsonwebtoken';

export interface InternalJwtAuthGuardConfig {
	jwtPublicKey: string;
	jwtSigningAlgorithm: Algorithm;
	scDomain: string;
}

export interface InternalXApiKeyAuthGuardConfig {
	allowedApiKeys: string[];
}

export enum AuthGuardOptions {
	JWT = 'jwt',
	WS_JWT = 'ws-jwt',
	X_API_KEY = 'x-api-key',
}

export interface AuthGuardModuleOptions {
	option: AuthGuardOptions;
	configInjectionToken: string;
	configConstructor: new () => InternalJwtAuthGuardConfig | InternalXApiKeyAuthGuardConfig;
}
