import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { MailService } from './mail.service';

export interface InternalMailModuleConfig {
	mailSendExchange: string;
	mailSendRoutingKey: string;
	blocklistOfEmailDomains: string[];
}
@Module({})
export class MailModule {
	public static register<T extends InternalMailModuleConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		const providers = [
			MailService,
			{
				provide: 'MAIL_SERVICE_OPTIONS',
				useFactory: (
					config: InternalMailModuleConfig
				): { exchange: string; routingKey: string; domainBlacklist: string[] } => {
					return {
						exchange: config.mailSendExchange,
						routingKey: config.mailSendRoutingKey,
						domainBlacklist: config.blocklistOfEmailDomains,
					};
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: MailModule,
			imports: [ConfigurationModule.register(configInjectionToken, constructor)],
			providers,
			exports: [MailService],
		};
	}
}
