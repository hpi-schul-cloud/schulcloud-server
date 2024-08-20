import { DynamicModule, Module } from '@nestjs/common';
import { CoursesClientAdapter } from './courses-client.adapter';
import { Configuration, ConfigurationParameters, CoursesApi } from './courses-api-client';

export interface CoursesClientConfig extends ConfigurationParameters {
	basePath?: string;
}

@Module({})
export class CoursesClientModule {
	static register(config: CoursesClientConfig): DynamicModule {
		const providers = [
			CoursesClientAdapter,
			{
				provide: CoursesApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new CoursesApi(configuration);
				},
			},
		];

		return {
			module: CoursesClientModule,
			providers,
			exports: [CoursesClientAdapter],
		};
	}
}
