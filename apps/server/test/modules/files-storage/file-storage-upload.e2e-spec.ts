import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

import { FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@shared/domain';
import { userFactory, roleFactory, cleanupCollections, mapUserToCurrentUser, fileRecordFactory } from '@shared/testing';
import S3rver from 's3rver';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async postUploadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.post(`/files-storage${routeName}`)
			.attach('file', Buffer.from('abcd'), 'test.txt')
			.set('connection', 'keep-alive')
			.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as HttpException,
			status: response.status,
		};
	}
}

describe('file-storage controller upload (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let s3instance: S3rver;

	beforeAll(async () => {
		s3instance = new S3rver({
			silent: true,
			directory: '/tmp/s3rver_test_directory',
			resetOnClose: true,
		});
		await s3instance.run();
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
		await s3instance.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, { permissions: [] });
		const user = userFactory.build({ roles });

		return user;
	};
	describe('upload with bad request data', () => {
		it('should return status 400 for invalid schoolId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.postUploadFile(`/upload/123/users/${validId}`);
			expect(response.error.message).toEqual(['schoolId must be a mongodb id']);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentId', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.postUploadFile(`/upload/${validId}/users/123`);
			expect(response.error.message).toEqual(['parentId must be a mongodb id']);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for invalid parentType', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.postUploadFile(`/upload/${validId}/cookies/${validId}`);
			expect(response.error.message).toEqual(['parentType must be a valid enum value']);
			expect(response.status).toEqual(400);
		});
	});

	describe(`upload with valid request data`, () => {
		const validId = new ObjectId().toHexString();
		it('should return status 201 for successful upload', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.postUploadFile(`/upload/${validId}/schools/${validId}`);

			expect(response.status).toEqual(201);
		});

		it('should return the new created file record', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.postUploadFile(`/upload/${validId}/schools/${validId}`);
			expect(result).toStrictEqual(
				expect.objectContaining({
					id: expect.any(String) as string,
					name: 'test.txt',
					parentId: validId,
					creatorId: currentUser.userId,
					type: 'text/plain',
					parentType: 'schools',
				})
			);
		});

		it('should read file name from upload stream', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.postUploadFile(`/upload/${validId}/schools/${validId}`);

			expect(result.name).toEqual('test.txt');
		});

		it.skip('should set iterator number to file name if file already exist', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			const file = fileRecordFactory.build({ name: 'test', parentId: validId });

			await em.persistAndFlush([file]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.postUploadFile(`/upload/${validId}/school/${validId}`);

			expect(result.name).toEqual('test (1)');
		});
	});
});
