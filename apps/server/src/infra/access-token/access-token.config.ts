import { ValkeyConfig } from '@infra/valkey-client';

export const ACCESS_TOKEN_VALKEY_CLIENT = 'ACCESS_TOKEN_VALKEY_CLIENT';
export interface AccessTokenModuleOptions {
	configInjectionToken: string;
	configConstructor: new () => ValkeyConfig;
}
