import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { LessonClientAdapter } from './lesson-client.adapter';
import { LessonClientConfig } from './lesson-client.config';
import { Configuration, LessonApi } from './lessons-api-client';

@Module({})
export class LessonClientModule {
	public static register(configInjectionToken: string, configConstructor: new () => LessonClientConfig): DynamicModule {
		const providers = [
			LessonClientAdapter,
			{
				provide: LessonApi,
				useFactory: (configInstance: LessonClientConfig): LessonApi => {
					const { basePath } = configInstance;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new LessonApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		return {
			module: LessonClientModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [LessonClientAdapter],
		};
	}
}
