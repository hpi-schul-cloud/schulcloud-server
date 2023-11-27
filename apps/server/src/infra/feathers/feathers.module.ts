import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from './feathers-service.provider';

/**
 * This Module gives access to legacy feathers services. It is request based injected.
 * Introduce strong typing immediately when using this modules service.
 */
@Module({
	providers: [FeathersServiceProvider],
	exports: [FeathersServiceProvider],
})
export class FeathersModule {}
