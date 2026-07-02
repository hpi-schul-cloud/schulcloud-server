import { LoggerModule } from '@infra/logger';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
