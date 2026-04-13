import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import {
	BoardsClientAdapter,
	CardClientAdapter,
	ColumnClientAdapter,
	CourseRoomsClientAdapter,
	CoursesClientAdapter,
	FilesStorageClientAdapter,
	LessonClientAdapter,
} from './adapter';
import {
	FILE_STORAGE_CLIENT_CONFIG_TOKEN,
	FileStorageClientConfig,
	InternalCommonCartridgeClientsConfig,
	InternalFilesStorageClientConfig,
} from './common-cartridge-clients.configs';
import { FileApi } from './fs-generated';
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

// HTTP agents with keepAlive to prevent "socket hang up" errors during sequential API calls
const httpAgent = new http.Agent({ keepAlive: false, maxSockets: 50, timeout: 100 });
const httpsAgent = new https.Agent({ keepAlive: false, maxSockets: 50, timeout: 100 });
const baseOptions = { httpAgent, httpsAgent };

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
						baseOptions,
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
						baseOptions,
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
						baseOptions,
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
						baseOptions,
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
						baseOptions,
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
						baseOptions,
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
						baseOptions,
					});

					return new CourseRoomsApi(configuration);
				},
				inject: [configInjectionToken],
			},
			{
				provide: FileApi,
				useFactory: (config: InternalFilesStorageClientConfig): FileApi => {
					const { basePath } = config;
					const configuration = new Configuration({
						basePath: `${basePath}/api/v3`,
						baseOptions,
					});

					return new FileApi(configuration);
				},
				inject: [FILE_STORAGE_CLIENT_CONFIG_TOKEN],
			},
		];

		const adapters = [
			BoardsClientAdapter,
			CardClientAdapter,
			ColumnClientAdapter,
			CoursesClientAdapter,
			LessonClientAdapter,
			CourseRoomsClientAdapter,
			FilesStorageClientAdapter,
		];

		const providers = [...apis, ...adapters];

		return {
			module: CommonCartridgeClientsModule,
			imports: [
				LoggerModule,
				HttpModule,
				ConfigurationModule.register(configInjectionToken, configConstructor),
				ConfigurationModule.register(FILE_STORAGE_CLIENT_CONFIG_TOKEN, FileStorageClientConfig),
			],
			providers,
			exports: [...adapters],
		};
	}
}
