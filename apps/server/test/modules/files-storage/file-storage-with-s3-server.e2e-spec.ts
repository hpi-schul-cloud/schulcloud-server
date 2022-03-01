import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

import { FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@shared/domain';
import { userFactory, cleanupCollections, mapUserToCurrentUser } from '@shared/testing';
import { ApiValidationError } from '@shared/common';
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
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getDownloadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(`/files-storage${routeName}`)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe('file-storage controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let s3instance: S3rver;
	const validId = new ObjectId().toHexString();

	beforeAll(async () => {
		s3instance = new S3rver({
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
		const user = userFactory.build();

		await em.persistAndFlush([user]);
		em.clear();

		currentUser = mapUserToCurrentUser(user);
	});

	describe('upload action', () => {
		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.postUploadFile(`/upload/123/users/${validId}`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['schoolId must be a mongodb id'],
						field: 'schoolId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.postUploadFile(`/upload/${validId}/users/123`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: 'parentId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.postUploadFile(`/upload/${validId}/cookies/${validId}`);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			it('should return status 201 for successful upload', async () => {
				const response = await api.postUploadFile(`/upload/${validId}/schools/${validId}`);

				expect(response.status).toEqual(201);
			});

			it('should return the new created file record', async () => {
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
				const { result } = await api.postUploadFile(`/upload/${validId}/schools/${validId}`);

				expect(result.name).toEqual('test.txt');
			});

			it.skip('should set iterator number to file name if file already exist', async () => {
				const { result } = await api.postUploadFile(`/upload/${validId}/school/${validId}`);

				expect(result.name).toEqual('test (1)');
			});
		});
	});

	describe('download action', () => {
		describe('with bad request data', () => {
			it('should return status 400 for invalid recordId', async () => {
				const response = await api.getDownloadFile('/download/123/text.txt');

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: 'fileRecordId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 404 for wrong filename', async () => {
				const { result } = await api.postUploadFile(`/upload/${validId}/users/${validId}`);
				const response = await api.getDownloadFile(`/download/${result.id}/wrong-name.txt`);

				expect(response.error.message).toEqual('File not found');
				expect(response.status).toEqual(404);
			});

			it('should return status 404 for file not found', async () => {
				const response = await api.getDownloadFile(`/download/${validId}/wrong-name.txt`);

				expect(response.error.message).toEqual(`The requested FileRecord: ${validId} has not been found.`);
				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			it('should return status 200 for successful download', async () => {
				const { result } = await api.postUploadFile(`/upload/${validId}/users/${validId}`);
				const response = await api.getDownloadFile(`/download/${result.id}/${result.name}`);

				expect(response.status).toEqual(200);
			});
		});
	});
});
