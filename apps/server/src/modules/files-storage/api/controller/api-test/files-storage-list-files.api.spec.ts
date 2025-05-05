import { createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import { FileRecordParentType, PreviewStatus, StorageLocation } from '../../../domain';
import { FilesStorageTestModule } from '../../../files-storage-test.module';
import { fileRecordEntityFactory } from '../../../testing';
import { FileRecordListResponse, FileRecordResponse } from '../../dto';
import { availableParentTypes } from './mocks';

const baseRouteName = '/file/list';

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
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

	describe('with not authenticated user', () => {
		it('should return status 401', async () => {
			const response = await testApiClient.get(`/school/123/users/123`);

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

		it('should return status 400 for invalid schoolId', async () => {
			const { loggedInClient, validId } = setup();
			const response = await loggedInClient.get(`/school/123/users/${validId}`);
			const { validationErrors } = response.body as ApiValidationError;

			expect(response.status).toEqual(400);
			expect(validationErrors).toEqual([
				{
					errors: ['storageLocationId must be a mongodb id'],
					field: ['storageLocationId'],
				},
			]);
		});

		it('should return status 400 for invalid parentId', async () => {
			const { loggedInClient, validId } = setup();
			const response = await loggedInClient.get(`/school/${validId}/users/123`);
			const { validationErrors } = response.body as ApiValidationError;

			expect(validationErrors).toEqual([
				{
					errors: ['parentId must be a mongodb id'],
					field: ['parentId'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentType', async () => {
			const { loggedInClient, validId } = setup();
			const response = await loggedInClient.get(`/school/${validId}/cookies/${validId}`);
			const { validationErrors } = response.body as ApiValidationError;

			expect(validationErrors).toEqual([
				{
					errors: [`parentType must be one of the following values: ${availableParentTypes}`],
					field: ['parentType'],
				},
			]);
			expect(response.status).toEqual(400);
		});
	});

	describe(`with valid request data`, () => {
		const setup = () => {
			const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

			const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

			const validId = new ObjectId().toHexString();

			return { loggedInClient, validId };
		};

		it('should return status 200 for successful request', async () => {
			const { loggedInClient, validId } = setup();

			const response = await loggedInClient.get(`/school/${validId}/schools/${validId}`);

			expect(response.status).toEqual(200);
		});

		it('should return a paginated result as default', async () => {
			const { loggedInClient, validId } = setup();

			const result = await loggedInClient.get(`/school/${validId}/schools/${validId}`);
			const response = result.body as FileRecordListResponse;

			expect(response).toEqual({
				total: 0,
				limit: 10,
				skip: 0,
				data: [],
			});
		});

		it('should pass the pagination qurey params', async () => {
			const { loggedInClient, validId } = setup();

			const result = await loggedInClient.get(`/school/${validId}/schools/${validId}`).query({ limit: 100, skip: 100 });
			const response = result.body as FileRecordListResponse;

			expect(response.limit).toEqual(100);
			expect(response.skip).toEqual(100);
		});

		it('should return right type of data', async () => {
			const { loggedInClient, validId } = setup();
			const fileRecords = fileRecordEntityFactory.buildList(1, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush(fileRecords);
			em.clear();

			const result = await loggedInClient.get(`/school/${validId}/schools/${validId}`);
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
				mimeType: 'application/octet-stream',
				securityCheckStatus: 'pending',
				size: expect.any(Number),
				previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
			});
		});

		it('should return elements of requested scope', async () => {
			const { loggedInClient, validId } = setup();
			const fileRecords = fileRecordEntityFactory.buildList(3, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			const otherFileRecords = fileRecordEntityFactory.buildList(3, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush([...otherFileRecords, ...fileRecords]);
			em.clear();

			const result = await loggedInClient.get(`/school/${validId}/schools/${validId}`);
			const response = result.body as FileRecordListResponse;

			const resultData: FileRecordResponse[] = response.data;
			const ids: EntityId[] = resultData.map((o) => o.id);

			expect(response.total).toEqual(3);
			expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
		});
	});
});
