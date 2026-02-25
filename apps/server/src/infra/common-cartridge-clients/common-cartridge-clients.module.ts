import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import {
	BoardApi,
	BoardCardApi,
	BoardColumnApi,
	BoardElementApi,
	Configuration,
	CourseRoomsApi,
	CoursesApi,
	LessonApi,
} from './generated';
import { InternalCommonCartridgeClientsConfig } from './common-cartridge-clients.config';
import {
	BoardsClientAdapter,
	CardClientAdapter,
	ColumnClientAdapter,
	CourseRoomsClientAdapter,
	CoursesClientAdapter,
	LessonClientAdapter,
} from './adapter';

@Module({})
export class CommonCartridgeClientsModule {
	public static register(
		configInjectionToken: string,
		configConstructor: new () => InternalCommonCartridgeClientsConfig
	): DynamicModule {
		const apis = [
			{
				provide: BoardApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): BoardApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: BoardCardApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): BoardCardApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardCardApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: BoardElementApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): BoardElementApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardElementApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: BoardColumnApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): BoardColumnApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new BoardColumnApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: CoursesApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): CoursesApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new CoursesApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: LessonApi,
				useFactory: (configInstance: InternalCommonCartridgeClientsConfig): LessonApi => {
					const { basePath } = configInstance;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new LessonApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: CourseRoomsApi,
				useFactory: (config: InternalCommonCartridgeClientsConfig): CourseRoomsApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/v3`,
					});

					return new CourseRoomsApi(configuration);
				},
				inject: [configInjectionToken],
			},
		];

		const adapters = [
			BoardsClientAdapter,
			CardClientAdapter,
			ColumnClientAdapter,
			CoursesClientAdapter,
			LessonClientAdapter,
			CourseRoomsClientAdapter,
		];

		const providers = [...apis, ...adapters];

		return {
			module: CommonCartridgeClientsModule,
			imports: [ConfigurationModule.register(configInjectionToken, configConstructor)],
			providers,
			exports: [...adapters],
		};
	}
}
