import { LegacyLogger, LoggerModule } from '@core/logger';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheStoreFactory } from './cache-store.factory';
import { CacheConfig } from './interface';

@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: async (logger: LegacyLogger, configService: ConfigService<CacheConfig>) => {
				const storeInstance = await CacheStoreFactory.build(configService, logger);
				return {
					stores: [storeInstance],
				};
			},
			inject: [LegacyLogger, ConfigService],
			imports: [LoggerModule],
		}),
	],
	exports: [CacheModule],
})
export class CacheWrapperModule {}
