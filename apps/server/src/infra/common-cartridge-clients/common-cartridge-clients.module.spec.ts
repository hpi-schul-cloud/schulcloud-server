import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
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
	InternalCommonCartridgeClientsConfig,
	InternalFilesStorageClientConfig,
} from './common-cartridge-clients.configs';
import { CommonCartridgeClientsModule } from './common-cartridge-clients.module';
import { FileApi } from './fs-generated';
import {
	BoardApi,
	BoardCardApi,
	BoardColumnApi,
	BoardElementApi,
	CourseRoomsApi,
	CoursesApi,
	LessonApi,
} from './generated';

@Configuration()
class TestInternalCommonCartridgeClientsConfig implements InternalCommonCartridgeClientsConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/boards';
}

describe(CommonCartridgeClientsModule.name, () => {
	let module: TestingModule;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [CommonCartridgeClientsModule.register('CC_CLIENT_CONFIG', TestInternalCommonCartridgeClientsConfig)],
		})
			.overrideProvider('CC_CLIENT_CONFIG')
			.useValue({ basePath: 'https://configured-api.example/api' })
			.overrideProvider(FILE_STORAGE_CLIENT_CONFIG_TOKEN)
			.useValue({ basePath: 'https://configured-files.example' })
			.compile();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	it.each([BoardApi, BoardCardApi, BoardColumnApi, BoardElementApi, CourseRoomsApi, CoursesApi, LessonApi])(
		'should use the configured API host for %p',
		(apiConstructor) => {
			const config = module.get<InternalCommonCartridgeClientsConfig>('CC_CLIENT_CONFIG');
			const client = module.get(apiConstructor);

			expect(Reflect.get(client, 'basePath')).toBe(`${config.basePath}/v3`);
		}
	);

	it('should use the configured file-storage host', () => {
		const config = module.get<InternalFilesStorageClientConfig>(FILE_STORAGE_CLIENT_CONFIG_TOKEN);
		const client = module.get(FileApi);

		expect(Reflect.get(client, 'basePath')).toBe(`${config.basePath}/api/v3`);
	});

	describe('when resolving dependencies', () => {
		it('should resolve BoardsClientAdapter', async () => {
			const adapter = await module.resolve(BoardsClientAdapter);

			expect(adapter).toBeInstanceOf(BoardsClientAdapter);
		});

		it('should resolve CardClientAdapter', async () => {
			const adapter = await module.resolve(CardClientAdapter);
			expect(adapter).toBeInstanceOf(CardClientAdapter);
		});

		it('should resolve ColumnClientAdapter', async () => {
			const adapter = await module.resolve(ColumnClientAdapter);
			expect(adapter).toBeInstanceOf(ColumnClientAdapter);
		});

		it('should resolve CoursesClientAdapter', async () => {
			const adapter = await module.resolve(CoursesClientAdapter);
			expect(adapter).toBeInstanceOf(CoursesClientAdapter);
		});

		it('should resolve LessonClientAdapter', async () => {
			const adapter = await module.resolve(LessonClientAdapter);
			expect(adapter).toBeInstanceOf(LessonClientAdapter);
		});

		it('should resolve CourseRoomsClientAdapter', async () => {
			const adapter = await module.resolve(CourseRoomsClientAdapter);
			expect(adapter).toBeInstanceOf(CourseRoomsClientAdapter);
		});

		it('should resolve FilesStorageClientAdapter', async () => {
			const adapter = await module.resolve(FilesStorageClientAdapter);
			expect(adapter).toBeInstanceOf(FilesStorageClientAdapter);
		});
	});
});
