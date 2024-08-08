import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import {
	cleanupCollections,
	courseFactory,
	fileRecordFactory,
	mapUserToCurrentUser,
	schoolEntityFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/infra/auth-guard/guard/jwt-auth.guard';
import NodeClam from 'clamscan';
import { Request } from 'express';
import FileType from 'file-type-cjs/file-type-cjs-index';
import request from 'supertest';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordParentType, StorageLocation } from '../../interface';
import { CopyFileParams, CopyFilesOfParentParams, FileRecordListResponse, FileRecordResponse } from '../dto';
import { availableParentTypes } from './mocks';

const baseRouteName = '/file/copy';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

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

describe(`${baseRouteName} (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideProvider(FILES_STORAGE_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
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
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('copy files of parent', () => {
		let validId: string;
		let targetParentId: EntityId;
		let copyFilesParams: CopyFilesOfParentParams;

		describe('with bad request data', () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent, account]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
				targetParentId = targetParent.id;

				copyFilesParams = {
					target: {
						storageLocation: StorageLocation.SCHOOL,
						storageLocationId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
				};
			});

			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.copy(`/school/123/users/${validId}`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.copy(`/school/${validId}/users/123`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.copy(`/school/${validId}/cookies/${validId}`, copyFilesParams);
				expect(response.error.validationErrors).toEqual([
					{
						errors: [`parentType must be one of the following values: ${availableParentTypes}`],
						field: ['parentType'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				copyFilesParams = {
					target: {
						storageLocation: StorageLocation.SCHOOL,
						storageLocationId: 'invalidObjectId',
						parentId: 'invalidObjectId',
						parentType: FileRecordParentType.Task,
					},
				};
				const response = await api.copy(`/school/${validId}/users/${validId}`, copyFilesParams);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent, account]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
				targetParentId = targetParent.id;

				copyFilesParams = {
					target: {
						storageLocation: StorageLocation.SCHOOL,
						storageLocationId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
				};

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));
			});

			it('should return status 200 for successful request', async () => {
				await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`, 'test1.txt');

				const response = await api.copy(`/school/${validId}/schools/${validId}`, copyFilesParams);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`, 'test1.txt');
				const { result } = await api.copy(`/school/${validId}/schools/${validId}`, copyFilesParams);

				expect(Array.isArray(result.data)).toBe(true);
				expect(result.data[0]).toBeDefined();
				expect(result.data[0]).toStrictEqual({
					id: expect.any(String),
					name: expect.any(String),
					sourceId: expect.any(String),
				});
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
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent, account]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				targetParentId = targetParent.id;

				validId = user.school.id;
				copyFileParams = {
					target: {
						storageLocation: StorageLocation.SCHOOL,
						storageLocationId: validId,
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
						field: ['fileRecordId'],
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			let fileRecordId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });
				const targetParent = courseFactory.build({ teachers: [user] });

				await em.persistAndFlush([user, school, targetParent, account]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				targetParentId = targetParent.id;

				validId = user.school.id;
				copyFileParams = {
					target: {
						storageLocation: StorageLocation.SCHOOL,
						storageLocationId: validId,
						parentId: targetParentId,
						parentType: FileRecordParentType.Course,
					},
					fileNamePrefix: 'copy from',
				};

				const { result } = await api.postUploadFile(
					`/file/upload/school/${school.id}/schools/${school.id}`,
					'test1.txt'
				);

				fileRecordId = result.id;
			});

			it('should return status 200 for successful request', async () => {
				const response = await api.copyFile(`/${fileRecordId}`, copyFileParams);

				expect(response.status).toEqual(201);
			});

			it('should return right type of data', async () => {
				const { result } = await api.copyFile(`/${fileRecordId}`, copyFileParams);

				expect(result).toStrictEqual({
					id: expect.any(String),
					name: expect.any(String),
					sourceId: expect.any(String),
				});
			});

			it('should return elements not equal of requested scope', async () => {
				const otherFileRecords = fileRecordFactory.buildList(3, {
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
