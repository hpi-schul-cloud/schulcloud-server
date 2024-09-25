import { DynamicModule, Module } from '@nestjs/common';
import { CourseRoomsClientAdapter } from './room-client.adapter';
import { Configuration, CourseRoomsApi } from './room-api-client';
import { CourseRoomsClientConig } from './courses-room-client.config';

@Module({})
export class CourseRoomsModule {
	static register(config: CourseRoomsClientConig): DynamicModule {
		const providers = [
			CourseRoomsClientAdapter,
			{
				provide: CourseRoomsApi,
				useFactory: () => {
					const configuration = new Configuration(config);
					return new CourseRoomsApi(configuration);
				},
			},
		];

		return {
			module: CourseRoomsModule,
			providers,
			exports: [CourseRoomsClientAdapter],
		};
	}
}
