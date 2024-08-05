import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import {
	cleanupCollections,
	mapUserToCurrentUser,
	schoolEntityFactory,
	UserAndAccountTestFactory,
} from '@shared/testing';
import NodeClam from 'clamscan';
import { Request } from 'express';
import FileType from 'file-type-cjs/file-type-cjs-index';
import request from 'supertest';
import { FileRecord } from '../../entity';
import { ErrorType } from '../../error';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { TestHelper } from '../../helper/test-helper';
import { FileRecordResponse } from '../dto';
import { availableParentTypes } from './mocks';

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

	async postUploadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.post(routeName)
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

	async postUploadFromUrl(routeName: string, data: Record<string, unknown>) {
		const response = await request(this.app.getHttpServer()).post(routeName).send(data);

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getDownloadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
			headers: response.headers as Record<string, string>,
		};
	}

	async getDownloadFileBytesRange(routeName: string, bytesRange: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.set('Range', bytesRange)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
			headers: response.headers as Record<string, string>,
		};
	}
}

const createRndInt = (max) => Math.floor(Math.random() * max);

describe('files-storage controller (API)', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let currentUser: ICurrentUser;
	let api: API;
	let validId: EntityId;
	let appPort: number;

	beforeAll(async () => {
		appPort = 10000 + createRndInt(10000);

		module = await Test.createTestingModule({
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
		const a = await app.init();
		await a.listen(appPort);

		em = module.get(EntityManager);
		s3ClientAdapter = module.get(FILES_STORAGE_S3_CONNECTION);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
		const school = schoolEntityFactory.build();
		const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

		await em.persistAndFlush([user, school, account]);
		em.clear();
		validId = school.id;
		currentUser = mapUserToCurrentUser(user);

		jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));
	});

	describe('upload action', () => {
		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.postUploadFile(`/file/upload/school/123/users/${validId}`);

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.postUploadFile(`/file/upload/school/${validId}/users/123`);

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.postUploadFile(`/file/upload/school/${validId}/cookies/${validId}`);

				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			it('should return status 201 for successful upload', async () => {
				const response = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);

				expect(response.status).toEqual(201);
			});

			it('should return the new created file record', async () => {
				const { result } = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);

				expect(result).toStrictEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: 'test.txt',
						parentId: validId,
						creatorId: currentUser.userId,
						mimeType: 'text/plain',
						parentType: 'schools',
						securityCheckStatus: 'pending',
						size: expect.any(Number),
					})
				);
			});

			it('should set iterator number to file name if file already exist', async () => {
				await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);

				const { result } = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);

				expect(result.name).toEqual('test (1).txt');
			});
		});
	});

	describe('upload from url action', () => {
		let body = {
			url: 'http://localhost/test.txt',
			fileName: 'test.txt',
		};
		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const response = await api.postUploadFromUrl(`/file/upload-from-url/school/123/users/${validId}`, body);

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const response = await api.postUploadFromUrl(`/file/upload-from-url/school/${validId}/users/123`, body);

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const response = await api.postUploadFromUrl(
					`/file/upload-from-url/school/${validId}/cookies/${validId}`,
					body
				);

				expect(response.error.validationErrors).toEqual([
					{
						errors: [`parentType must be one of the following values: ${availableParentTypes}`],
						field: ['parentType'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for empty url and fileName', async () => {
				const response = await api.postUploadFromUrl(`/file/upload-from-url/school/${validId}/schools/${validId}`, {});

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['url should not be empty', 'url must be a string'],
						field: ['url'],
					},
					{
						errors: ['fileName should not be empty', 'fileName must be a string'],
						field: ['fileName'],
					},
				]);
				expect(response.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			describe(`with new file`, () => {
				beforeEach(async () => {
					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					const uploadResponse = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);
					const { result } = uploadResponse;
					body = {
						url: `http://localhost:${appPort}/file/download/${result.id}/${result.name}`,
						fileName: 'test.txt',
					};
				});

				it('should return status 201 for successful upload', async () => {
					const response = await api.postUploadFromUrl(
						`/file/upload-from-url/school/${validId}/schools/${validId}`,
						body
					);

					expect(response.status).toEqual(201);
				});

				it('should return the new created file record', async () => {
					const { result } = await api.postUploadFromUrl(
						`/file/upload-from-url/school/${validId}/schools/${validId}`,
						body
					);
					expect(result).toStrictEqual(
						expect.objectContaining({
							id: expect.any(String),
							name: 'test (1).txt',
							parentId: validId,
							creatorId: currentUser.userId,
							mimeType: 'application/octet-stream',
							parentType: 'schools',
							securityCheckStatus: 'pending',
						})
					);
				});
			});

			describe(`with already existing file`, () => {
				beforeEach(async () => {
					const expectedResponse1 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					const expectedResponse2 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse1).mockResolvedValueOnce(expectedResponse2);

					const uploadResponse = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);
					const { result } = uploadResponse;
					body = {
						url: `http://localhost:${appPort}/file/download/${result.id}/${result.name}`,
						fileName: 'test.txt',
					};

					await api.postUploadFromUrl(`/file/upload-from-url/school/${validId}/schools/${validId}`, body);
				});

				it('should set iterator number to file name if file already exist', async () => {
					const { result } = await api.postUploadFromUrl(
						`/file/upload-from-url/school/${validId}/schools/${validId}`,
						body
					);

					expect(result.name).toEqual('test (2).txt');
				});
			});
		});
	});

	describe('download action', () => {
		describe('with bad request data', () => {
			it('should return status 400 for invalid recordId', async () => {
				const response = await api.getDownloadFile('/file/download/123/text.txt');

				expect(response.error.validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: ['fileRecordId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 404 for wrong filename', async () => {
				const { result } = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);
				const response = await api.getDownloadFile(`/file/download/${result.id}/wrong-name.txt`);

				expect(response.error.message).toEqual(ErrorType.FILE_NOT_FOUND);
				expect(response.status).toEqual(404);
			});

			it('should return status 404 for file not found', async () => {
				const response = await api.getDownloadFile(`/file/download/${validId}/wrong-name.txt`);

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			describe('when mimetype is not application/pdf', () => {
				const setup = async () => {
					const { result: uploadedFile } = await api.postUploadFile(
						`/file/upload/school/${validId}/schools/${validId}`
					);
					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'image/webp' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile };
				};

				it('should return status 200 for successful download', async () => {
					const { uploadedFile } = await setup();

					const response = await api.getDownloadFile(`/file/download/${uploadedFile.id}/${uploadedFile.name}`);

					expect(response.status).toEqual(200);
				});

				it('should return status 206 and required headers for the successful partial file stream download', async () => {
					const { uploadedFile } = await setup();

					const response = await api.getDownloadFileBytesRange(
						`/file/download/${uploadedFile.id}/${uploadedFile.name}`,
						'bytes=0-'
					);

					expect(response.status).toEqual(206);

					expect(response.headers['accept-ranges']).toMatch('bytes');
					expect(response.headers['content-range']).toMatch('bytes 0-3/4');
				});

				it('should set content-disposition header to attachment', async () => {
					const { uploadedFile } = await setup();

					const response = await api.getDownloadFile(`/file/download/${uploadedFile.id}/${uploadedFile.name}`);

					expect(response.headers['content-disposition']).toMatch('attachment');
				});
			});

			describe('when mimetype is application/pdf', () => {
				const setup = async () => {
					const { result: uploadedFile } = await api.postUploadFile(
						`/file/upload/school/${validId}/schools/${validId}`
					);
					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'application/pdf' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile };
				};

				it('should set content-disposition to inline', async () => {
					const { uploadedFile } = await setup();

					const response = await api.getDownloadFile(`/file/download/${uploadedFile.id}/${uploadedFile.name}`);

					expect(response.headers['content-disposition']).toMatch('inline');
				});
			});
		});
	});

	describe('file-security.download()', () => {
		describe('with bad request data', () => {
			it('should return status 404 for wrong token', async () => {
				const response = await api.getDownloadFile('/file-security/download/test-token');

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			const setup = async () => {
				const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
				s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

				const { result } = await api.postUploadFile(`/file/upload/school/${validId}/schools/${validId}`);
				const newRecord = await em.findOneOrFail(FileRecord, result.id);

				return { newRecord };
			};

			it('should return status 200 for successful download', async () => {
				const { newRecord } = await setup();
				const response = await api.getDownloadFile(
					`/file-security/download/${newRecord.securityCheck.requestToken || ''}`
				);

				expect(response.status).toEqual(200);
			});
		});
	});
});
