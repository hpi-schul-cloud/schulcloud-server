import { InjectionToken } from '@nestjs/common';
import { type ValkeyConfig } from '../valkey.config';

export type ValkeyClientModuleFactory = {
	createValkeyModuleOptions: () => Promise<ValkeyConfig> | ValkeyConfig;
};

export type ValkeyClientModuleAsyncOptions = {
	injectionToken: string;
	inject?: InjectionToken[];
	useFactory?: (...args: never[]) => Promise<ValkeyConfig> | ValkeyConfig;
};
export interface ValkeyClientModuleOptions {
	clientInjectionToken: string;
	configInjectionToken: string;
	configConstructor: new () => ValkeyConfig;
}
