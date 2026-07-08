import { type ValkeyConfig } from '../valkey.config';

export type ValkeyClientModuleFactory = {
	createValkeyModuleOptions: () => Promise<ValkeyConfig> | ValkeyConfig;
};

export interface ValkeyClientModuleOptions {
	clientInjectionToken: string;
	configInjectionToken: string;
	configConstructor: new () => ValkeyConfig;
}
