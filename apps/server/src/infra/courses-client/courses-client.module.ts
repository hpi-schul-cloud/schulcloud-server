import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { CoursesClientAdapter } from './courses-client.adapter';
import { InternalCoursesClientConfig } from './courses-client.config';
import { Configuration, CoursesApi } from './generated';

@Module({})
export class CoursesClientModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalCoursesClientConfig
	): DynamicModule {
		const providers = [
			CoursesClientAdapter,
			{
				provide: CoursesApi,
				useFactory: (config: InternalCoursesClientConfig): CoursesApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new CoursesApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: CoursesClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [CoursesClientAdapter],
		};
	}
}
