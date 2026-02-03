import { Module } from '@nestjs/common';
import { ErrorModule } from './error';
import { TimeoutInterceptorModule } from './interceptor';
import { LoggerModule } from './logger';
import { ValidationModule } from './validation';

/**
 * The core module configures the cross-functional application behaviour by customizing error handling providing and logging.
 * Overrides/Configures global APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER
 */
@Module({
	imports: [LoggerModule, ErrorModule, ValidationModule, TimeoutInterceptorModule.forRoot()],
	exports: [LoggerModule, ErrorModule],
})
export class CoreModule {}
