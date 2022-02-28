import { Module } from '@nestjs/common';
import { ErrorModule } from './error';
import { LoggerModule } from './logger';
import { ValidationModule } from './validation';
import { InterceptorModule } from './interceptor';

/**
 * The core module configures the cross-functional application behaviour by customizing error handling providing and logging.
 * Overrides/Configures global APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER
 */
@Module({
	imports: [LoggerModule, ErrorModule, ValidationModule, InterceptorModule],
})
export class CoreModule {}
