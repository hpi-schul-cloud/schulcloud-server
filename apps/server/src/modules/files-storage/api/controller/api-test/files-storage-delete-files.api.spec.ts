import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ApiValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { FileRecordParentType, PreviewStatus } from '../../../domain';
import { FilesStorageTestModule } from '../../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../../files-storage.config';
import { fileRecordEntityFactory } from '../../../testing';
import { FileRecordListResponse, FileRecordResponse } from '../../dto';
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

	describe('delete files of parent', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const loggedInClient = new TestApiClient(app, baseRouteName);

				const result = await loggedInClient.delete(`/delete/school/123/users/123`);

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				return { loggedInClient, validId };
			};

			it('should return status 400 for invalid schoolId', async () => {
				const { loggedInClient, validId } = setup();

				const result = await loggedInClient.delete(`/delete/school/123/users/${validId}`);
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

				const result = await loggedInClient.delete(`/delete/school/${validId}/users/123`);
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

				const result = await loggedInClient.delete(`/delete/school/${validId}/cookies/${validId}`);
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
			const uploadFile = async (
				loggedInClient: TestApiClient,
				schoolId: string,
				parentId: string,
				fileName: string
			) => {
				const response = await loggedInClient
					.post(`/upload/school/${schoolId}/schools/${parentId}`)
					.attach('file', Buffer.from('abcd'), fileName)
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');

				return response.body as FileRecordResponse;
			};

			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				return { loggedInClient, validId };
			};

			it('should return right type of data', async () => {
				const { loggedInClient, validId } = setup();

				await uploadFile(loggedInClient, validId, validId, 'test1.txt');

				const result = await loggedInClient.delete(`/delete/school/${validId}/schools/${validId}`);
				const response = result.body as FileRecordListResponse;

				expect(result.status).toEqual(200);
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
					deletedSince: expect.any(String),
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const { loggedInClient, validId } = setup();
				const otherParentId = new ObjectId().toHexString();
				const fileRecords = await Promise.all([
					await uploadFile(loggedInClient, validId, validId, 'test1.txt'),
					await uploadFile(loggedInClient, validId, validId, 'test2.txt'),
					await uploadFile(loggedInClient, validId, validId, 'test3.txt'),
					await uploadFile(loggedInClient, validId, otherParentId, 'other1.txt'),
					await uploadFile(loggedInClient, validId, otherParentId, 'other2.txt'),
					await uploadFile(loggedInClient, validId, otherParentId, 'other3.txt'),
				]);

				const result = await loggedInClient.delete(`/delete/school/${validId}/schools/${validId}`);
				const response = result.body as FileRecordListResponse;

				const resultData: FileRecordResponse[] = response.data;
				const ids: EntityId[] = resultData.map((o) => o.id);

				expect(response.total).toEqual(3);
				expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
			});
		});
	});

	describe('delete single file', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const response = await testApiClient.delete(`/delete/123`);

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				return { loggedInClient };
			};

			it('should return status 400 for invalid fileRecordId', async () => {
				const { loggedInClient } = setup();

				const response = await loggedInClient.delete(`/delete/123`);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: ['fileRecordId'],
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				const result = await loggedInClient
					.post(`/upload/school/${validId}/schools/${validId}`)
					.attach('file', Buffer.from('abcd'), 'test1.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const response = result.body as FileRecordResponse;
				const fileRecordId = response.id;

				return { loggedInClient, fileRecordId };
			};

			it('should return status 200 for successful request', async () => {
				const { loggedInClient, fileRecordId } = await setup();

				const response = await loggedInClient.delete(`/delete/${fileRecordId}`);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				const { loggedInClient, fileRecordId } = await setup();

				const result = await loggedInClient.delete(`/delete/${fileRecordId}`);
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
					deletedSince: expect.any(String),
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const { loggedInClient, fileRecordId } = await setup();
				const otherFileRecords = fileRecordEntityFactory.buildList(3, {
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(otherFileRecords);
				em.clear();

				const result = await loggedInClient.delete(`/delete/${fileRecordId}`);
				const response = result.body as FileRecordResponse;

				expect(response.id).toEqual(fileRecordId);
			});
		});
	});

	describe('delete multiple files', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const fileRecordIds = { fileRecordIds: ['123'] };
				const response = await testApiClient.delete(`/delete`, fileRecordIds);

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				return { loggedInClient };
			};

			it('should return status 400 for invalid fileRecordId', async () => {
				const { loggedInClient } = setup();

				const fileRecordIds = { fileRecordIds: ['123'] };
				const response = await loggedInClient.delete(`/delete`, fileRecordIds);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['each value in fileRecordIds must be a mongodb id'],
						field: ['fileRecordIds'],
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId1 = new ObjectId().toHexString();

				const result1 = await loggedInClient
					.post(`/upload/school/${validId1}/schools/${validId1}`)
					.attach('file', Buffer.from('abcd'), 'test1.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const response1 = result1.body as FileRecordResponse;
				const fileRecordId1 = response1.id;

				const validId2 = new ObjectId().toHexString();

				const result2 = await loggedInClient
					.post(`/upload/school/${validId2}/schools/${validId2}`)
					.attach('file', Buffer.from('abcd'), 'test1.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const response2 = result2.body as FileRecordResponse;
				const fileRecordId2 = response2.id;
				const fileRecordIds = { fileRecordIds: [fileRecordId1, fileRecordId2] };

				return { loggedInClient, fileRecordIds };
			};

			it('should return status 200 for successful request', async () => {
				const { loggedInClient, fileRecordIds } = await setup();

				const response = await loggedInClient.delete(`/delete`, fileRecordIds);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				const { loggedInClient, fileRecordIds } = await setup();

				const result = await loggedInClient.delete(`/delete`, fileRecordIds);
				const response = result.body as FileRecordResponse;

				expect(response).toStrictEqual({
					data: [
						{
							creatorId: expect.any(String),
							id: expect.any(String),
							name: expect.any(String),
							url: expect.any(String),
							parentId: expect.any(String),
							createdAt: expect.any(String),
							updatedAt: expect.any(String),
							parentType: 'schools',
							mimeType: 'text/plain',
							deletedSince: expect.any(String),
							securityCheckStatus: 'pending',
							size: expect.any(Number),
							previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
						},
						{
							creatorId: expect.any(String),
							id: expect.any(String),
							name: expect.any(String),
							url: expect.any(String),
							parentId: expect.any(String),
							createdAt: expect.any(String),
							updatedAt: expect.any(String),
							parentType: 'schools',
							mimeType: 'text/plain',
							deletedSince: expect.any(String),
							securityCheckStatus: 'pending',
							size: expect.any(Number),
							previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
						},
					],
					total: 2,
				});
			});
		});
	});
});
