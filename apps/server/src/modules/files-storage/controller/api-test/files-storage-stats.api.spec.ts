import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { fileRecordFactory } from '../../testing';
import { FilesStorageStatsResponse } from '../dto';

const baseRouteName = '/file';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
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
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get stats', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const response = await testApiClient.get('/stats/school/123/users/123');

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				return { loggedInClient, validId };
			};

			it('should return status 400 for invalid storageLocationId', async () => {
				const { loggedInClient, validId } = setup();

				const response = await loggedInClient.get(`/stats/school/123/users/${validId}`);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const { loggedInClient, validId } = setup();

				const response = await loggedInClient.get(`/stats/school/${validId}/users/123`);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe('with valid request data', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				// Create some test files
				const fileRecords = [
					fileRecordFactory.build({ parentId: validId, size: 100 }),
					fileRecordFactory.build({ parentId: validId, size: 200 }),
					fileRecordFactory.build({ parentId: validId, size: 300 }),
				];

				await em.persistAndFlush(fileRecords);
				em.clear();

				return { loggedInClient, validId };
			};

			it('should return status 200 for successful request', async () => {
				const { loggedInClient, validId } = await setup();

				const response = await loggedInClient.get(`/stats/school/${validId}/schools/${validId}`);

				expect(response.status).toEqual(200);
			});

			it('should return correct statistics', async () => {
				const { loggedInClient, validId } = await setup();

				const response = await loggedInClient.get(`/stats/school/${validId}/schools/${validId}`);
				const stats = response.body as FilesStorageStatsResponse;

				expect(stats).toEqual({
					totalSize: 600, // 100 + 200 + 300
					totalCount: 3,
				});
			});

			it('should not include deleted files in statistics', async () => {
				const { loggedInClient, validId } = await setup();

				// Create a deleted file
				const deletedFile = fileRecordFactory.build({
					parentId: validId,
					size: 400,
					deletedSince: new Date(),
				});
				await em.persistAndFlush(deletedFile);
				em.clear();

				const response = await loggedInClient.get(`/stats/school/${validId}/schools/${validId}`);
				const stats = response.body as FilesStorageStatsResponse;

				// The deleted file should not be included in the statistics
				expect(stats).toEqual({
					totalSize: 600, // 100 + 200 + 300 (deleted file's 400 not included)
					totalCount: 3,
				});
			});
		});
	});
});
