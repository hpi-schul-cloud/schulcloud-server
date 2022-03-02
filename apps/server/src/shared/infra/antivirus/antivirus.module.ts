import { Module, DynamicModule } from '@nestjs/common';
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
			],
			exports: [AntivirusService],
		};
	}
}
