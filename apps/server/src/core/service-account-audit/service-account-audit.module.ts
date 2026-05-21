import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from '../logger';
import { ServiceAccountAuditInterceptor } from './service-account-audit.interceptor';

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: ServiceAccountAuditInterceptor,
		},
	],
})
export class ServiceAccountAuditModule {}
