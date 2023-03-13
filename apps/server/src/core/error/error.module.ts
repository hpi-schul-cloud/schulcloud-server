import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LegacyLogger } from '../logger';
import { GlobalErrorFilter } from './filter/global-error.filter';

/**
 * Overrides the default global Exception Filter of NestJS provided by @APP_FILTER
 */
@Module({
	providers: [
		{
			provide: APP_FILTER,
			useClass: GlobalErrorFilter,
		},
		LegacyLogger,
	],
})
export class ErrorModule {}
