import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { ColumnClientAdapter } from './column-client.adapter';
import { InternalColumnClientConfig } from './column-client.config';
import { BoardColumnApi, Configuration } from './generated';

@Module({})
export class ColumnClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalColumnClientConfig
	): DynamicModule {
		const providers = [
			ColumnClientAdapter,
			{
				provide: BoardColumnApi,
				useFactory: (config: InternalColumnClientConfig): BoardColumnApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardColumnApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: ColumnClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [ColumnClientAdapter],
		};
	}
}
