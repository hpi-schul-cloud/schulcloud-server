import { LegacyLogger, LoggerModule } from '@core/logger';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheStoreFactory } from './cache-store.factory';
import { CacheConfig } from './interface/cache-config.interface';

@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: async (
				cacheService: CacheStoreFactory,
				logger: LegacyLogger,
				configService: ConfigService<CacheConfig>
			) => {
				const storeInstance = await cacheService.build(configService, logger);
				return {
					stores: [storeInstance],
				};
			},
			inject: [CacheStoreFactory, LegacyLogger, ConfigService],
			imports: [LoggerModule, CacheWrapperModule],
		}),
	],
	providers: [CacheStoreFactory],
	exports: [CacheModule, CacheStoreFactory],
})
export class CacheWrapperModule {}
