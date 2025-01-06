import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { FilesStorageRestClientAdapter } from './files-storage-rest-client.adapter';
import { FilesStorageRestClientModule } from './files-storage-rest-client.module';

describe.skip(FilesStorageRestClientModule.name, () => {
	let module: TestingModule;

	const configServiceMock = createMock<ConfigService>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [FilesStorageRestClientModule, ConfigModule.forRoot({ isGlobal: true })],
			providers: [
				{
					provide: REQUEST,
					scope: Scope.REQUEST,
					useValue: createMock<Request>({
						headers: {
							authorization: `Bearer ${faker.string.alphanumeric(42)}`,
						},
					}),
				},
			],
		})
			.overrideProvider(ConfigService)
			.useValue(configServiceMock)
			.compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	describe('resolve providers', () => {
		describe('when resolving FilesStorageRestClientAdapter', () => {
			it('should resolve FilesStorageRestClientAdapter', async () => {
				const provider = await module.resolve(FilesStorageRestClientAdapter);

				expect(provider).toBeInstanceOf(FilesStorageRestClientAdapter);
			});
		});
	});
});
