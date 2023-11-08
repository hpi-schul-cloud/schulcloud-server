import { DynamicModule, Module } from '@nestjs/common';
import NodeClam from 'clamscan';
import { AntivirusService } from './antivirus.service';
import { AntivirusModuleOptions } from './interfaces';

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
					useFactory: () => {
						const isLocalhost = options.hostname === 'localhost';

						return new NodeClam().init({
							debugMode: isLocalhost,
							clamdscan: {
								host: options.hostname,
								port: options.port,
								bypassTest: isLocalhost,
								localFallback: false,
							},
						});
					},
				},
			],

			exports: [AntivirusService],
		};
	}
}
