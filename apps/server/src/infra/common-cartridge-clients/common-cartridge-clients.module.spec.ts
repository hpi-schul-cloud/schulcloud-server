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
import { InternalCommonCartridgeClientsConfig } from './common-cartridge-clients.configs';
import { CommonCartridgeClientsModule } from './common-cartridge-clients.module';

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
		}).compile();
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
