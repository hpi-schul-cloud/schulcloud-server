import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { PreviewStatus } from '../../entity';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordParentType } from '../../interface';
import { fileRecordFactory } from '../../testing';
import { FileRecordListResponse, FileRecordResponse } from '../dto';
import { availableParentTypes } from './mocks';

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

	describe('restore files of parent', () => {
		describe('with not authenticated uer', () => {
			it('should return status 401', async () => {
				const result = await testApiClient.post(`/restore/school/123/users/123`);

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				return { validId, loggedInClient };
			};

			it('should return status 400 for invalid schoolId', async () => {
				const { loggedInClient, validId } = setup();

				const result = await loggedInClient.post(`/restore/school/123/users/${validId}`);
				const { validationErrors } = result.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(result.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const { loggedInClient, validId } = setup();

				const result = await loggedInClient.post(`/restore/school/${validId}/users/123`);
				const { validationErrors } = result.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(result.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const { loggedInClient, validId } = setup();

				const result = await loggedInClient.post(`/restore/school/${validId}/cookies/${validId}`);
				const { validationErrors } = result.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: [`parentType must be one of the following values: ${availableParentTypes}`],
						field: ['parentType'],
					},
				]);
				expect(result.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				return { validId, loggedInClient };
			};

			const uploadFile = async (loggedInClient: TestApiClient, path: string, fileName: string) => {
				const result = await loggedInClient
					.post(path)
					.attach('file', Buffer.from('abcd'), fileName)
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');

				return result.body as FileRecordResponse;
			};

			it('should return status 200 for successful request', async () => {
				const { validId, loggedInClient } = setup();
				await uploadFile(loggedInClient, `/upload/school/${validId}/schools/${validId}`, 'test1.txt');

				await loggedInClient.delete(`/school/${validId}/schools/${validId}`);

				const response = await loggedInClient.post(`/restore/school/${validId}/schools/${validId}`);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				const { validId, loggedInClient } = setup();
				await uploadFile(loggedInClient, `/upload/school/${validId}/schools/${validId}`, 'test1.txt');

				await loggedInClient.delete(`/delete/school/${validId}/schools/${validId}`);

				const result = await loggedInClient.post(`/restore/school/${validId}/schools/${validId}`);
				const response = result.body as FileRecordListResponse;

				expect(Array.isArray(response.data)).toBe(true);
				expect(response.data[0]).toBeDefined();
				expect(response.data[0]).toStrictEqual({
					creatorId: expect.any(String),
					id: expect.any(String),
					name: expect.any(String),
					url: expect.any(String),
					parentId: expect.any(String),
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
					parentType: 'schools',
					mimeType: 'text/plain',
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const { validId, loggedInClient } = setup();

				const otherParentId = new ObjectId().toHexString();
				const fileRecords = await Promise.all([
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${validId}`, 'test1.txt'),
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${validId}`, 'test2.txt'),
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${validId}`, 'test3.txt'),
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${otherParentId}`, 'other1.txt'),
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${otherParentId}`, 'other3.txt'),
					uploadFile(loggedInClient, `/upload/school/${validId}/schools/${otherParentId}`, 'other2.txt'),
				]);

				await loggedInClient.delete(`/delete/school/${validId}/schools/${validId}`);

				const result = await loggedInClient.post(`/restore/school/${validId}/schools/${validId}`);
				const response = result.body as FileRecordListResponse;

				const resultData: FileRecordResponse[] = response.data;
				const ids: EntityId[] = resultData.map((o) => o.id);

				expect(response.total).toEqual(3);
				expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
			});
		});
	});

	describe('restore single file', () => {
		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				return { loggedInClient };
			};

			it('should return status 400 for invalid fileRecordId', async () => {
				const { loggedInClient } = setup();

				const result = await loggedInClient.post(`/restore/123`);
				const { validationErrors } = result.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: ['fileRecordId'],
					},
				]);
				expect(result.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			let fileRecordId: string;

			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				const result = (
					await loggedInClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test1.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
				).body as FileRecordResponse;

				fileRecordId = result.id;

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				return { loggedInClient };
			};

			it('should return status 200 for successful request', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.delete(`/delete/${fileRecordId}`);

				const response = await loggedInClient.post(`/restore/${fileRecordId}`);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.delete(`/delete/${fileRecordId}`);

				const result = await loggedInClient.post(`/restore/${fileRecordId}`);
				const response = result.body as FileRecordResponse;

				expect(response).toStrictEqual({
					creatorId: expect.any(String),
					id: expect.any(String),
					name: expect.any(String),
					url: expect.any(String),
					parentId: expect.any(String),
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
					parentType: 'schools',
					mimeType: 'text/plain',
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const { loggedInClient } = await setup();
				const otherFileRecords = fileRecordFactory.buildList(3, {
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(otherFileRecords);
				em.clear();

				await loggedInClient.delete(`/delete/${fileRecordId}`);

				const result = await loggedInClient.post(`/restore/${fileRecordId}`);
				const response = result.body as FileRecordResponse;

				expect(response.id).toEqual(fileRecordId);
			});
		});
	});
});
