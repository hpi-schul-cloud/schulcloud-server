import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN, FilesStorageRestClientConfig } from './files-storage-client.config';
import { FilesStorageRestClientModule } from './files-storage-rest-client.module';
import { FileApi } from './generated';

describe(FilesStorageRestClientModule.name, () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				FilesStorageRestClientModule.register(FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN, FilesStorageRestClientConfig),
			],
		})
			.overrideProvider(REQUEST)
			.useValue(requestMock)
			.overrideProvider(FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN)
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

	it('should use the configured file-storage host', () => {
		const config = module.get<FilesStorageRestClientConfig>(FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN);
		const client = module.get(FileApi);

		expect(Reflect.get(client, 'basePath')).toBe(`${config.basePath}/api/v3`);
	});

	describe('resolve providers', () => {
		describe('when resolving FilesStorageRestClientAdapter', () => {
			it('should resolve FilesStorageRestClientAdapter', async () => {
				const provider = await module.resolve(FilesStorageClientAdapter);

				expect(provider).toBeInstanceOf(FilesStorageClientAdapter);
			});
		});
	});
});
