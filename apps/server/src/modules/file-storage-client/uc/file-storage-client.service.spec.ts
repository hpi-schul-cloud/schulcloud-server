import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { FileApiFactory } from '../fileStorageApi/v3';
import { FileStorageClientAdapterService } from './file-storage-client.service';

describe('FileStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: DeepMocked<FileStorageClientAdapterService>;
	let config: DeepMocked<ConfigService>;
	// let client: DeepMocked<FileRecordRepo>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FileStorageClientAdapterService,
				{
					provide: FileStorageClientAdapterService,
					useValue: createMock<FileStorageClientAdapterService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(FileStorageClientAdapterService);
		config = module.get(ConfigService);
	});

	afterEach(async () => {
		await module.close();
	});

	describe('copyFilesOfParent', () => {
		it('Shoul call all steps', () => {});
	});
});
