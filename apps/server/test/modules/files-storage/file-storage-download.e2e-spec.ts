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

	async getDownloadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(`/files-storage${routeName}`)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as HttpException,
			status: response.status,
		};
	}
}

describe('file-storage controller download (e2e)', () => {
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
	describe('download with bad request data', () => {
		it('should return status 400 for invalid recordId', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.getDownloadFile('/download/123/text.txt');
			expect(response.error.message).toEqual(['fileRecordId must be a mongodb id']);
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for wrong filename', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.postUploadFile(`/upload/${validId}/users/${validId}`);
			const response = await api.getDownloadFile(`/download/${result.id}/wrong-name.txt`);

			expect(response.error.message).toEqual('File not found');
			expect(response.status).toEqual(400);
		});

		it('should return status 400 for file not found', async () => {
			const user = setup();
			const validId = new ObjectId().toHexString();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.getDownloadFile(`/download/${validId}/wrong-name.txt`);

			expect(response.error.message).toEqual(`The requested FileRecord: ${validId} has not been found.`);
			expect(response.status).toEqual(400);
		});
	});

	describe(`download with valid request data`, () => {
		const validId = new ObjectId().toHexString();
		it('should return status 201 for successful download', async () => {
			const user = setup();

			await em.persistAndFlush([user]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const { result } = await api.postUploadFile(`/upload/${validId}/users/${validId}`);
			const response = await api.getDownloadFile(`/download/${result.id}/${result.name}`);

			expect(response.status).toEqual(200);
		});
	});
});
