import { Module } from '@nestjs/common';
import { ErrorModule } from './error/error.module';
import { LoggerModule } from './logger/logger.module';
import { ValidationModule } from './validation/validation.module';

/**
 * The core module configures the cross-functional application behaviour by customizing error handling providing and logging.
 * Overrides/Configures global APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER
 */
@Module({
	imports: [LoggerModule, ErrorModule, ValidationModule],
	exports: [LoggerModule, ErrorModule, ValidationModule],
})
export class CoreModule {}
