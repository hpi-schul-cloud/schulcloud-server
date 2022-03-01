import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';

import { FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordListResponse, FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { EntityId, FileRecordParentType, ICurrentUser } from '@shared/domain';
import {
	userFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	fileRecordFactory,
	schoolFactory,
} from '@shared/testing';
import { ApiValidationError } from '@shared/common';

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
	let orm: MikroORM;
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
			.compile();

		app = module.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		const roles = roleFactory.buildList(1, { permissions: [] });
		const school = schoolFactory.build();
		const user = userFactory.build({ roles, school });

		await em.persistAndFlush([user]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);
		validId = user.school.id;
	});

	describe('with bad request data', () => {
		it('should return status 400 for invalid schoolId', async () => {
			const response = await api.get(`/123/users/${validId}`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['schoolId must be a mongodb id'],
					field: 'schoolId',
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentId', async () => {
			const response = await api.get(`/${validId}/users/123`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['parentId must be a mongodb id'],
					field: 'parentId',
				},
			]);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentType', async () => {
			const response = await api.get(`/${validId}/cookies/${validId}`);
			expect(response.error.validationErrors).toEqual([
				{
					errors: ['parentType must be a valid enum value'],
					field: 'parentType',
				},
			]);
			expect(response.status).toEqual(400);
		});
	});

	describe(`with valid request data`, () => {
		it('should return status 200 for successful request', async () => {
			const response = await api.get(`/${validId}/schools/${validId}`);

			expect(response.status).toEqual(200);
		});

		it('should return a paginated result as default', async () => {
			const { result } = await api.get(`/${validId}/schools/${validId}`);

			expect(result).toEqual({
				total: 0,
				limit: 10,
				skip: 0,
				data: [],
			});
		});

		// query params do not work why?
		it.skip('should pass the pagination qurey params', async () => {
			const { result } = await api.get(`/${validId}/schools/${validId}`, { limit: 100, skip: 100 });

			expect(result.limit).toEqual(100);
			expect(result.skip).toEqual(100);
		});

		it('should return right type of data', async () => {
			const fileRecords = fileRecordFactory.buildList(1, {
				schoolId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush(fileRecords);
			em.clear();

			const { result } = await api.get(`/${validId}/schools/${validId}`);

			expect(Array.isArray(result.data)).toBe(true);
			expect(result.data[0]).toBeDefined();
			expect(result.data[0]).toStrictEqual({
				creatorId: expect.any(String) as string,
				id: expect.any(String) as string,
				name: expect.any(String) as string,
				parentId: expect.any(String) as string,
				parentType: 'schools',
				type: 'application/octet-stream', // fuh why ???
			});
		});

		it('should return elements of requested scope', async () => {
			const fileRecords = fileRecordFactory.buildList(3, {
				schoolId: validId,
				parentId: validId,
				parentType: FileRecordParentType.School,
			});
			const otherFileRecords = fileRecordFactory.buildList(3, {
				schoolId: validId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush([...otherFileRecords, ...fileRecords]);
			em.clear();

			const { result } = await api.get(`/${validId}/schools/${validId}`);

			const resultData: FileRecordResponse[] = result.data;
			const ids: EntityId[] = resultData.map((o) => o.id);

			expect(result.total).toEqual(3);
			expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
		});
	});
});
