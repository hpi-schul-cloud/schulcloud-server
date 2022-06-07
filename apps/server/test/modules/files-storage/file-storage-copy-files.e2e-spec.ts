import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId, FileRecordParentType, ICurrentUser, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import {
	cleanupCollections,
	courseFactory,
	fileRecordFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import {
	CopyFileParams,
	CopyFilesOfParentParams,
	FileRecordListResponse,
	FileRecordResponse,
} from '@src/modules/files-storage/controller/dto';
import { config, FilesStorageTestModule } from '@src/modules/files-storage/files-storage.module';
import { Request } from 'express';
import S3rver from 's3rver';
import request from 'supertest';

const baseRouteName = '/file/copy';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async postUploadFile(routeName: string, fileName: string) {
		const response = await request(this.app.getHttpServer())
			.post(routeName)
			.attach('file', Buffer.from('abcd'), fileName)
			.set('connection', 'keep-alive')
			.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async copyFile(requestString: string, body: CopyFileParams) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}${requestString}`)
			.send(body || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async copy(requestString: string, body: CopyFilesOfParentParams) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json')
			.send(body || {});

		return {
			result: response.body as FileRecordListResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;
	let s3instance: S3rver;

	beforeAll(async () => {
		const port = 10000 + createRndInt(10000);
		const overridetS3Config = Object.assign(config, { endpoint: `http://localhost:${port}` });

		s3instance = new S3rver({
			directory: `/tmp/s3rver_test_directory${port}`,
			port,
		});

		await s3instance.run();
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
			providers: [
				FilesStorageTestModule,
				{
					provide: 'S3_Config',
					useValue: overridetS3Config,
				},
			],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
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

	describe('copy files of parent', () => {
		let validId: string;
		let targetParentId: EntityId;
		let copyFilesParams: CopyFilesOfParentParams;

		describe('with bad request data', () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
				});
				const user = userFactory.build({ school, roles });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
				targetParentId = targetParent.id;

				copyFilesParams = {
					target: {
						schoolId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
				};
			});

			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.copy(`/123/users/${validId}`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['schoolId must be a mongodb id'],
						field: 'schoolId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.copy(`/${validId}/users/123`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: 'parentId',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.copy(`/${validId}/cookies/${validId}`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentType must be a valid enum value'],
						field: 'parentType',
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				copyFilesParams = {
					target: {
						schoolId: 'invalidObjectId',
						parentId: 'invalidObjectId',
						parentType: FileRecordParentType.Task,
					},
				};
				const response = await api.copy(`/${validId}/users/${validId}`, copyFilesParams);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
				});
				const user = userFactory.build({ school, roles });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
				targetParentId = targetParent.id;

				copyFilesParams = {
					target: {
						schoolId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
				};
			});

			it('should return status 200 for successful request', async () => {
				await api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt');

				const response = await api.copy(`/${validId}/schools/${validId}`, copyFilesParams);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				await api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt');
				const { result } = await api.copy(`/${validId}/schools/${validId}`, copyFilesParams);

				expect(Array.isArray(result.data)).toBe(true);
				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toStrictEqual({
					creatorId: expect.any(String) as string,
					id: expect.any(String) as string,
					name: expect.any(String) as string,
					parentId: targetParentId,
					parentType: FileRecordParentType.Course,
					type: 'text/plain',
					securityCheckStatus: 'pending',
					size: expect.any(Number) as number,
				});
			});

			it('should return elements of requested scope', async () => {
				const otherParentId = new ObjectId().toHexString();
				await Promise.all([
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test2.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test3.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other1.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other2.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other3.txt'),
				]);

				const { result } = await api.copy(`/${validId}/schools/${validId}`, copyFilesParams);

				const resultData: FileRecordResponse[] = result.data;
				const ids: EntityId[] = resultData.map((o) => o.parentId);

				expect(result.total).toEqual(3);
				expect(ids.sort()).toEqual(
					[copyFilesParams.target.parentId, copyFilesParams.target.parentId, copyFilesParams.target.parentId].sort()
				);
			});
		});
	});

	describe('copy single file', () => {
		let copyFileParams: CopyFileParams;
		let validId: string;
		let targetParentId: EntityId;
		describe('with bad request data', () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
				});
				const user = userFactory.build({ school, roles });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				targetParentId = targetParent.id;

				validId = user.school.id;
				copyFileParams = {
					target: {
						schoolId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
					fileNamePrefix: 'copy from',
				};
			});

			it('should return status 400 for invalid fileRecordId', async () => {
				const response = await api.copyFile(`/123`, copyFileParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: 'fileRecordId',
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			let fileRecordId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
				});
				const user = userFactory.build({ school, roles });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				targetParentId = targetParent.id;

				validId = user.school.id;
				copyFileParams = {
					target: {
						schoolId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
					fileNamePrefix: 'copy from',
				};

				const { result } = await api.postUploadFile(`/file/upload/${school.id}/schools/${school.id}`, 'test1.txt');

				fileRecordId = result.id;
			});

			it('should return status 200 for successful request', async () => {
				const response = await api.copyFile(`/${fileRecordId}`, copyFileParams);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				const { result } = await api.copyFile(`/${fileRecordId}`, copyFileParams);

				expect(result).toStrictEqual({
					creatorId: expect.any(String) as string,
					id: expect.any(String) as string,
					name: expect.any(String) as string,
					parentId: targetParentId,
					parentType: FileRecordParentType.Course,
					type: 'text/plain',
					securityCheckStatus: 'pending',
					size: expect.any(Number) as number,
				});
			});

			it('should return elements not equal of requested scope', async () => {
				const otherFileRecords = fileRecordFactory.buildList(3, {
					schoolId: new ObjectId().toHexString(),
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(otherFileRecords);
				em.clear();
				const { result } = await api.copyFile(`/${fileRecordId}`, copyFileParams);

				expect(result.id).not.toEqual(fileRecordId);
			});
		});
	});
});
