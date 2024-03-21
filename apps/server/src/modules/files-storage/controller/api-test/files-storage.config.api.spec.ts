import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import NodeClam from 'clamscan';
import { TestApiClient } from '@shared/testing';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';

describe(`files-storage (api)`, () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideProvider(FILES_STORAGE_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(NodeClam)
			.useValue(createMock<NodeClam>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		testApiClient = new TestApiClient(app, 'file');
	});

	describe('config/public', () => {
		describe('when configuration is set', () => {
			it('should be return the public configuration as json', async () => {
				const response = await testApiClient.get('config/public');

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ MAX_FILE_SIZE: 2684354560 });
			});
		});
	});
});
