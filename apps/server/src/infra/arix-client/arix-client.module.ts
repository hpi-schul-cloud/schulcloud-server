import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConverterUtil } from '@shared/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { ARIX_REST_CLIENT_OPTIONS, ArixRestClientOptions } from './arix-rest-client-options';
import { ArixRestClient } from './arix-rest-client';
import { ArixController } from './arix.controller';

@Module({})
export class ArixClientModule {
	static register(options: ArixRestClientOptions): DynamicModule {
		return {
			module: ArixClientModule,
			imports: [HttpModule, LoggerModule],
			providers: [
				{
					provide: ARIX_REST_CLIENT_OPTIONS,
					useValue: options,
				},
				ArixRestClient,
				ConverterUtil,
				Logger,
			],
			controllers: options.withController ? [ArixController] : [],
			exports: [ArixRestClient],
		};
	}
}
