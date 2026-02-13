import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, TldrawDocumentApi } from './generated';
import { TldrawClientAdapter } from './tldraw-client.adapter';
import { InternalTldrawClientConfig } from './tldraw-client.config';

@Module({})
export class TldrawClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalTldrawClientConfig
	): DynamicModule {
		const providers = [
			TldrawClientAdapter,
			{
				provide: TldrawDocumentApi,
				useFactory: (config: InternalTldrawClientConfig): TldrawDocumentApi => {
					const configuration = new Configuration({
						basePath: config.tldrawAdminApiClientBaseUrl,
						baseOptions: {
							headers: {
								'X-API-Key': config.tldrawAdminApiClientApiKey,
							},
						},
					});
					return new TldrawDocumentApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: TldrawClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [TldrawClientAdapter],
		};
	}
}
