import { createMock } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Permission } from '@shared/domain/interface';

import { EntityId } from '@shared/domain/types';
import {
	cleanupCollections,
	fileRecordFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import NodeClam from 'clamscan';
import { Request } from 'express';
import FileType from 'file-type-cjs/file-type-cjs-index';
import request from 'supertest';
import { FileRecordParentType, PreviewStatus } from '../../entity';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { FileRecordListResponse, FileRecordResponse } from '../dto';
import { availableParentTypes } from './mocks';

const baseRouteName = '/file/delete';

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

	async deleteFile(requestString: string) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}${requestString}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async delete(requestString: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.delete(`${baseRouteName}${requestString}`)
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
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('delete files of parent', () => {
		describe('with bad request data', () => {
			let validId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW, Permission.FILESTORAGE_REMOVE],
				});
				const user = userFactory.build({ school, roles });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;
			});

			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.delete(`/123/users/${validId}`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['schoolId must be a mongodb id'],
						field: ['schoolId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.delete(`/${validId}/users/123`);
				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.delete(`/${validId}/cookies/${validId}`);
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
			let validId: string;

			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW, Permission.FILESTORAGE_REMOVE],
				});
				const user = userFactory.build({ school, roles });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				validId = user.school.id;

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));
			});

			it('should return status 200 for successful request', async () => {
				await api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt');

				const response = await api.delete(`/${validId}/schools/${validId}`);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				await api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt');

				const { result } = await api.delete(`/${validId}/schools/${validId}`);

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
					mimeType: 'text/plain',
					deletedSince: expect.any(String),
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const otherParentId = new ObjectId().toHexString();
				const uploadResponse = await Promise.all([
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test1.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test2.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${validId}`, 'test3.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other1.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other2.txt'),
					api.postUploadFile(`/file/upload/${validId}/schools/${otherParentId}`, 'other3.txt'),
				]);

				const fileRecords = uploadResponse.map(({ result }) => result);

				const { result } = await api.delete(`/${validId}/schools/${validId}`);

				const resultData: FileRecordResponse[] = result.data;
				const ids: EntityId[] = resultData.map((o) => o.id);

				expect(result.total).toEqual(3);
				expect(ids.sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
			});
		});
	});

	describe('delete single file', () => {
		describe('with bad request data', () => {
			beforeEach(async () => {
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW, Permission.FILESTORAGE_REMOVE],
				});
				const user = userFactory.build({ school, roles });

				await em.persistAndFlush([user]);
				em.clear();
			});

			it('should return status 400 for invalid fileRecordId', async () => {
				const response = await api.deleteFile(`/123`);
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
				const roles = roleFactory.buildList(1, {
					permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW, Permission.FILESTORAGE_REMOVE],
				});
				const user = userFactory.build({ school, roles });

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const { result } = await api.postUploadFile(`/file/upload/${school.id}/schools/${school.id}`, 'test1.txt');

				fileRecordId = result.id;
			});

			it('should return status 200 for successful request', async () => {
				const response = await api.deleteFile(`/${fileRecordId}`);

				expect(response.status).toEqual(200);
			});

			it('should return right type of data', async () => {
				const { result } = await api.deleteFile(`/${fileRecordId}`);

				expect(result).toStrictEqual({
					creatorId: expect.any(String),
					id: expect.any(String),
					name: expect.any(String),
					url: expect.any(String),
					parentId: expect.any(String),
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
					parentType: 'schools',
					mimeType: 'text/plain',
					deletedSince: expect.any(String),
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				});
			});

			it('should return elements of requested scope', async () => {
				const otherFileRecords = fileRecordFactory.buildList(3, {
					parentType: FileRecordParentType.School,
				});

				await em.persistAndFlush(otherFileRecords);
				em.clear();

				const { result } = await api.deleteFile(`/${fileRecordId}`);

				expect(result.id).toEqual(fileRecordId);
			});
		});
	});
});
