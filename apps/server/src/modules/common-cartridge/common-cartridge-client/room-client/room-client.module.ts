import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { InternalCourseRoomsClientConfig } from './courses-room-client.config';
import { Configuration, CourseRoomsApi } from './room-api-client';
import { CourseRoomsClientAdapter } from './room-client.adapter';

@Module({})
export class CourseRoomsModule {
	public static register(
		configInjectionToken: string,
		config: new () => InternalCourseRoomsClientConfig
	): DynamicModule {
		const providers = [
			CourseRoomsClientAdapter,
			{
				provide: CourseRoomsApi,
				useFactory: (config: InternalCourseRoomsClientConfig): CourseRoomsApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new CourseRoomsApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: CourseRoomsModule,
			imports: [ConfigurationModule.register(configInjectionToken, config)],
			providers,
			exports: [CourseRoomsClientAdapter],
		};
	}
}
