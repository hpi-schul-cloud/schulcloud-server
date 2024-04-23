import { HttpModule, HttpService } from '@nestjs/axios';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { EtherpadRestClient } from './etherpad-rest-client';
import { EtherpadRestClientOptions } from './etherpad-rest-client-options';

/**
 * @Global is used here to make sure that the module is only instantiated once, with the configuration and can be used in every module.
 * Otherwise, you need to import the module with configuration in every module where you want to use it.
 */
@Global()
@Module({})
export class EtherpadClientModule {
	static register(options: EtherpadRestClientOptions): DynamicModule {
		return {
			imports: [HttpModule, LoggerModule],
			module: EtherpadClientModule,
			providers: [
				{
					provide: EtherpadRestClient,
					useFactory: (httpService: HttpService, logger: Logger) =>
						new EtherpadRestClient(options, httpService, logger),
					inject: [HttpService, Logger],
				},
			],
			exports: [EtherpadRestClient],
		};
	}
}
