import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, ConfigurationParameters, TldrawDocumentApi } from './generated';
import { TldrawClientAdapter } from './tldraw-client.adapter';

export interface TldrawClientConfig extends ConfigurationParameters {
	basePath: string;
}

@Module({})
export class TldrawClientModule {
	static register(config: ConfigurationParameters): DynamicModule {
		const providers = [
			TldrawClientAdapter,
			{
				provide: TldrawDocumentApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new TldrawDocumentApi(configuration);
				},
			},
		];

		return {
			module: TldrawClientModule,
			providers,
			exports: [TldrawClientAdapter],
		};
	}
}
