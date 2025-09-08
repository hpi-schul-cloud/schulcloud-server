import { DynamicModule, Module } from '@nestjs/common';
import { Configuration, TldrawDocumentApi } from './generated';
import { TldrawClientAdapter } from './tldraw-client.adapter';
import { TldrawClientConfig } from './tldraw-client.config';

@Module({})
export class TldrawClientModule {
	public static register(config: TldrawClientConfig): DynamicModule {
		const providers = [
			TldrawClientAdapter,
			{
				provide: TldrawDocumentApi,
				useFactory: () => {
					const configuration = new Configuration({
						basePath: config.TLDRAW_ADMIN_API_CLIENT_BASE_URL,
						baseOptions: {
							headers: {
								'X-API-Key': config.TLDRAW_ADMIN_API_CLIENT_API_KEY,
							},
						},
					});
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
