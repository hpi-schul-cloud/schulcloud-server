import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

import { FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordListResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FileRecordParentType, ICurrentUser } from '@shared/domain';
import {
	userFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	fileRecordFactory,
	schoolFactory,
} from '@shared/testing';

const baseRouteName = '/files-storage/filesOfParent';

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
			error: response.body as HttpException,
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
		app.useGlobalPipes(
			new ValidationPipe({
				transform: true,
			})
		);
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
	});

	describe('with bad request data', () => {
		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });

			return user;
		};

		it('should return status 400 for invalid schoolId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.get(`/123/users/${validId}`);
			expect(response.error.message).toEqual(['schoolId must be a mongodb id']);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid targetId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.get(`/${validId}/users/123`);
			expect(response.error.message).toEqual(['targetId must be a mongodb id']);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid targetType', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.get(`/${validId}/cookies/${validId}`);
			expect(response.error.message).toEqual(['targetType must be a valid enum value']);
			expect(response.status).toEqual(400);
		});
	});

	describe(`with valid request data`, () => {
		const setup = async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const school = schoolFactory.build();
			const user = userFactory.build({ roles, school });

			await em.persistAndFlush([user]);
			em.clear();

			return { schoolId: school.id, user };
		};

		it('should return status 200 for successful request', async () => {
			const { schoolId, user } = await setup();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.get(`/${schoolId}/schools/${schoolId}`);

			expect(response.status).toEqual(200);
		});

		it('should return a paginated result as default', async () => {
			const { user, schoolId } = await setup();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get(`/${schoolId}/schools/${schoolId}`);

			expect(result).toEqual({
				total: 0,
				limit: 10,
				skip: 0,
				data: [],
			});
		});

		// query params do not work
		it.skip('should pass the pagination qurey params', async () => {
			const { user, schoolId } = await setup();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get(`/${schoolId}/schools/${schoolId}`, { limit: 100, skip: 100 });

			expect(result.limit).toEqual(100);
			expect(result.skip).toEqual(100);
		});

		it('should return right type of data', async () => {
			const { user, schoolId } = await setup();

			const fileRecords = fileRecordFactory.buildList(1, {
				schoolId,
				parentId: schoolId,
				parentType: FileRecordParentType.School,
			});

			await em.persistAndFlush(fileRecords);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get(`/${schoolId}/schools/${schoolId}`);

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
			const { user, schoolId } = await setup();

			const fileRecords = fileRecordFactory.buildList(3, {
				schoolId,
				parentId: schoolId,
				parentType: FileRecordParentType.School,
			});
			const otherFileRecords = fileRecordFactory.buildList(3, { schoolId, parentType: FileRecordParentType.School });

			await em.persistAndFlush([...otherFileRecords, ...fileRecords]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.get(`/${schoolId}/schools/${schoolId}`);

			expect(result.total).toEqual(3);
		});
	});
});
