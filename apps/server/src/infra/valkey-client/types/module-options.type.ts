import { InjectionToken } from '@nestjs/common';
import { type ValkeyConfig } from '../valkey.config';

export type ValkeyClientModuleFactory = {
	createValkeyModuleOptions: () => Promise<ValkeyConfig> | ValkeyConfig;
};

export type ValkeyClientModuleAsyncOptions = {
	inject?: InjectionToken[];
	useFactory?: (...args: never[]) => Promise<ValkeyConfig> | ValkeyConfig;
};
