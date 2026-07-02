import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN, FilesStorageRestClientConfig } from './files-storage-client.config';
import { FilesStorageRestClientModule } from './files-storage-rest-client.module';

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

	describe('resolve providers', () => {
		describe('when resolving FilesStorageRestClientAdapter', () => {
			it('should resolve FilesStorageRestClientAdapter', async () => {
				const provider = await module.resolve(FilesStorageClientAdapter);

				expect(provider).toBeInstanceOf(FilesStorageClientAdapter);
			});
		});
	});
});
