import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import {
	cleanupCollections,
	fileRecordFactory,
	mapUserToCurrentUser,
	schoolEntityFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import NodeClam from 'clamscan';
import { Request } from 'express';
import request from 'supertest';
import { PreviewStatus } from '../../entity';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FileRecordParentType, StorageLocation } from '../../interface';
import { FileRecordListResponse, FileRecordResponse } from '../dto';
import { availableParentTypes } from './mocks';

const baseRouteName = '/file/list';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(requestString: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as FileRecordListResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let validId: string;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.overrideProvider(NodeClam)
			.useValue(createMock<NodeClam>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with bad request data', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
			const school = schoolEntityFactory.build();
			const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

			await em.persistAndFlush([user, account]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			validId = user.school.id;
		});

		it('should return status 400 for invalid schoolId', async () => {
			const response = await api.get(`/school/123/users/${validId}`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['storageLocationId must be a mongodb id'],
					field: ['storageLocationId'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentId', async () => {
			const response = await api.get(`/school/${validId}/users/123`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['parentId must be a mongodb id'],
					field: ['parentId'],
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentType', async () => {
			const response = await api.get(`/school/${validId}/cookies/${validId}`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: [`parentType must be one of the following values: ${availableParentTypes}`],
					field: ['parentType'],
				},
			]);
			expect(response.status).toEqual(400);
		});
	});

	describe(`with valid request data`, () => {
		beforeEach(async () => {
			await cleanupCollections(em);
			const school = schoolEntityFactory.build();
			const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

			await em.persistAndFlush([user, account]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			validId = user.school.id;
		});

		it('should return status 200 for successful request', async () => {
			const response = await api.get(`/school/${validId}/schools/${validId}`);

			expect(response.status).toEqual(200);
		});

		it('should return a paginated result as default', async () => {
			const { result } = await api.get(`/school/${validId}/schools/${validId}`);

			expect(result).toEqual({
				total: 0,
				limit: 10,
				skip: 0,
				data: [],
			});
		});

		it('should pass the pagination qurey params', async () => {
			const { result } = await api.get(`/school/${validId}/schools/${validId}`, { limit: 100, skip: 100 });

			expect(result.limit).toEqual(100);
			expect(result.skip).toEqual(100);
		});

		it('should return right type of data', async () => {
			const fileRecords = fileRecordFactory.buildList(1, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush(fileRecords);
			em.clear();

			const { result } = await api.get(`/school/${validId}/schools/${validId}`);

			expect(Array.isArray(result.data)).toBe(true);
			expect(result.data[0]).toBeDefined();
			expect(result.data[0]).toStrictEqual({
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
			const fileRecords = fileRecordFactory.buildList(3, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			const otherFileRecords = fileRecordFactory.buildList(3, {
				storageLocation: StorageLocation.SCHOOL,
				storageLocationId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush([...otherFileRecords, ...fileRecords]);
			em.clear();

			const { result } = await api.get(`/school/${validId}/schools/${validId}`);

			const resultData: FileRecordResponse[] = result.data;
			const ids: EntityId[] = resultData.map((o) => o.id);

			expect(result.total).toEqual(3);
			expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
		});
	});
});
