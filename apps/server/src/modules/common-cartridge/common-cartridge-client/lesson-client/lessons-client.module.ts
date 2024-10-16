import { DynamicModule, Module } from '@nestjs/common';
import { LessonsClientConfig } from './lesson-client.config';
import { LessonClientAdapter } from './lesson-client.adapter';
import { LessonApi, Configuration } from './lessons-api-client';

@Module({})
export class LessonsClientModule {
	static register(config: LessonsClientConfig): DynamicModule {
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
			module: LessonsClientModule,
			providers,
			exports: [LessonClientAdapter],
		};
	}
}
