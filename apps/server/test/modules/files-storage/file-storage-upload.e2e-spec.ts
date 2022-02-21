import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

import { FilesStorageModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@shared/domain';
import {
	userFactory,
	roleFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	schoolFactory,
	fileRecordFactory,
} from '@shared/testing';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.set('connection', 'keep-alive')
			.set('content-length', '10699')
			.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			status: response.status,
		};
	}
}

describe('file-storage controller upload (e2e)', () => {
	describe('upload with bad request data', () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [FilesStorageModule],
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
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });

			return user;
		};

		it('should return status 404 for invalid schoolId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(`/upload/123/user/${validId}`);

			expect(response.status).toEqual(404);
		});

		it('should return status 404 for invalid targetId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(`/upload/${validId}/user/123`);

			expect(response.status).toEqual(404);
		});

		it('should return status 404 for invalid target type', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(`/upload/${validId}/cookies/${validId}`);

			expect(response.status).toEqual(404);
		});
	});

	describe(`upload with valid request data`, () => {
		let app: INestApplication;
		let orm: MikroORM;
		let em: EntityManager;
		let currentUser: ICurrentUser;
		let api: API;

		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [FilesStorageModule],
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
		});

		const setup = () => {
			const school = schoolFactory.build();
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles, school });

			return { user, school };
		};

		it.skip('should return status 201 for sussesful upload', async () => {
			const { user, school } = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.post(`/upload/${school.id}/school/${school.id}`);

			expect(response.status).toEqual(201);
		});

		it.skip('should return the new created file record', async () => {
			const { user, school } = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(`/upload/${school.id}/school/${school.id}`);

			expect(result).toBeInstanceOf(FileRecordResponse);
			expect(result.id).toBeInstanceOf(String);
		});

		it.skip('should read file name from upload stream', async () => {
			const { user, school } = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(`/upload/${school.id}/school/${school.id}`);

			expect(result.name).toEqual('test');
		});

		it.skip('should set iterator number to file name if file already exist', async () => {
			const { user, school } = setup();

			await em.persistAndFlush([user]);
			em.clear();

			const file = fileRecordFactory.build({ name: 'test', targetId: school.id });

			await em.persistAndFlush([file]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.post(`/upload/${school.id}/school/${school.id}`);

			expect(result.name).toEqual('test (1)');
		});
	});
});
