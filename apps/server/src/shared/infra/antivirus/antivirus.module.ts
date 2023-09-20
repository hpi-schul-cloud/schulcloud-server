import { DynamicModule, Module } from '@nestjs/common';
import NodeClam from 'clamscan';
import { AntivirusService } from './antivirus.service';

interface AntivirusModuleOptions {
	enabled: boolean;
	filesServiceBaseUrl: string;
	exchange: string;
	routingKey: string;
}

@Module({})
export class AntivirusModule {
	static forRoot(options: AntivirusModuleOptions): DynamicModule {
		return {
			module: AntivirusModule,
			providers: [
				AntivirusService,
				{
					provide: 'ANTIVIRUS_SERVICE_OPTIONS',
					useValue: {
						enabled: options.enabled,
						filesServiceBaseUrl: options.filesServiceBaseUrl,
						exchange: options.exchange,
						routingKey: options.routingKey,
					},
				},
				{
					provide: NodeClam,

					useFactory: () =>
						new NodeClam().init({
							debugMode: true,
							clamdscan: {
								// @to-do read for envs
								host: 'clamav-svc', // localhost
								port: 3310,
								bypassTest: false,
								localFallback: false,
							},
						}),
				},
			],

			exports: [AntivirusService],
		};
	}
}
