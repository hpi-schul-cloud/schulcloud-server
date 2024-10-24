import { DynamicModule, Module } from '@nestjs/common';
import { LessonClientConfig } from './lesson-client.config';
import { LessonClientAdapter } from './lesson-client.adapter';
import { LessonApi, Configuration } from './lessons-api-client';

@Module({})
export class LessonClientModule {
	static register(config: LessonClientConfig): DynamicModule {
		const providers = [
			LessonClientAdapter,
			{
				provide: LessonApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new LessonApi(configuration);
				},
			},
		];

		return {
			module: LessonClientModule,
			providers,
			exports: [LessonClientAdapter],
		};
	}
}
