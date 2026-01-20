import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { FilesStorageClientAdapter } from './files-storage-client.adapter';
import { FILE_STORAGE_API_HOST_CONFIG_TOKEN, FileStorageClientConfig } from './files-storage-client.config';
import { FilesStorageClientModule } from './files-storage-client.module';

describe(FilesStorageClientModule.name, () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				FilesStorageClientModule.register(FILE_STORAGE_API_HOST_CONFIG_TOKEN, FileStorageClientConfig),
				ConfigModule.forRoot({ isGlobal: true }),
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
			const setup = () => {};

			it('should resolve FilesStorageRestClientAdapter', async () => {
				setup();

				const provider = await module.resolve(FilesStorageClientAdapter);

				expect(provider).toBeInstanceOf(FilesStorageClientAdapter);
			});
		});
	});
});
