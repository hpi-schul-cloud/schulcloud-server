import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';

/**
 * The core module configures the cross-functional application behaviour by customizing error handling providing and logging.
 * Overrides/Sets global APP_INTERCEPTOR, APP_PIPE, APP_GUARD, APP_FILTER
 */
@Module({
	imports: [LoggerModule],
	exports: [LoggerModule],
})
export class CoreModule {}
