import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { FileRecord } from '../../entity';
import { ErrorType } from '../../error';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { TestHelper } from '../../helper/test-helper';
import { availableParentTypes } from './mocks';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

const createRndInt = (max) => Math.floor(Math.random() * max);

describe('files-storage controller (API)', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let appPort: number;
	let testApiClient: TestApiClient;

	const baseRouteName = '/file';

	beforeAll(async () => {
		appPort = 10000 + createRndInt(10000);

		module = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideProvider(FILES_STORAGE_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
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
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe('upload action', () => {
		const setup = () => {
			jest.resetAllMocks();
			const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

			const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

			const validId = new ObjectId().toHexString();

			jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

			return { validId, loggedInClient, user: studentUser };
		};

		const uploadFile = async (routeName: string, apiClient: TestApiClient) => {
			const response = await apiClient
				.post(routeName)
				.attach('file', Buffer.from('abcd'), 'test.txt')
				.set('connection', 'keep-alive')
				.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');

			return response;
		};

		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const { validId } = setup();
				const loggedInClient = new TestApiClient(app, baseRouteName);

				const result = await uploadFile(`/upload/school/123/users/${validId}`, loggedInClient);

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const { loggedInClient, validId } = setup();

				const result = await uploadFile(`/upload/school/123/users/${validId}`, loggedInClient);

				const { validationErrors } = result.body as ApiValidationError;
				expect(validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(result.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const { loggedInClient, validId } = setup();

				const result = await uploadFile(`/upload/school/${validId}/users/123`, loggedInClient);

				const { validationErrors } = result.body as ApiValidationError;
				expect(validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(result.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const { loggedInClient, validId } = setup();

				const result = await uploadFile(`/upload/school/${validId}/cookies/${validId}`, loggedInClient);

				expect(result.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			it('should return status 201 for successful upload', async () => {
				const { loggedInClient, validId } = setup();

				const response = await uploadFile(`upload/school/${validId}/schools/${validId}`, loggedInClient);

				expect(response.status).toEqual(201);
			});

			it('should return the new created file record', async () => {
				const { loggedInClient, validId, user } = setup();

				const result = await uploadFile(`/upload/school/${validId}/schools/${validId}`, loggedInClient);
				const response = result.body as FileRecord;

				expect(response).toStrictEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: 'test.txt',
						parentId: validId,
						creatorId: user.id,
						mimeType: 'text/plain',
						parentType: 'schools',
						securityCheckStatus: 'pending',
						size: expect.any(Number),
					})
				);
			});

			it('should set iterator number to file name if file already exist', async () => {
				const { loggedInClient, validId } = setup();

				await uploadFile(`/upload/school/${validId}/schools/${validId}`, loggedInClient);

				const result = await uploadFile(`/upload/school/${validId}/schools/${validId}`, loggedInClient);
				const response = result.body as FileRecord;

				expect(response.name).toEqual('test (1).txt');
			});
		});
	});

	describe('upload from url action', () => {
		describe('with not authenticated user', () => {
			const setup = () => {
				const body = {
					url: 'http://localhost/test.txt',
					fileName: 'test.txt',
				};

				return { body };
			};

			it('should return status 401', async () => {
				const { body } = setup();

				const response = await testApiClient.post(`/upload-from-url/school/123/users/123`, body);

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = () => {
				jest.resetAllMocks();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const body = {
					url: 'http://localhost/test.txt',
					fileName: 'test.txt',
				};

				return { validId, loggedInClient, body };
			};

			it('should return status 400 for invalid schoolId', async () => {
				const { loggedInClient, validId, body } = setup();

				const response = await loggedInClient.post(`/upload-from-url/school/123/users/${validId}`, body);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['storageLocationId must be a mongodb id'],
						field: ['storageLocationId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentId', async () => {
				const { loggedInClient, validId, body } = setup();

				const response = await loggedInClient.post(`/upload-from-url/school/${validId}/users/123`, body);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['parentId must be a mongodb id'],
						field: ['parentId'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for invalid parentType', async () => {
				const { loggedInClient, validId, body } = setup();

				const response = await loggedInClient.post(`/upload-from-url/school/${validId}/cookies/${validId}`, body);
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: [`parentType must be one of the following values: ${availableParentTypes}`],
						field: ['parentType'],
					},
				]);
				expect(response.status).toEqual(400);
			});

			it('should return status 400 for empty url and fileName', async () => {
				const { validId, loggedInClient } = setup();

				const response = await loggedInClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, {});
				const { validationErrors } = response.body as ApiValidationError;

				expect(validationErrors).toEqual([
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
				const setup = async () => {
					jest.resetAllMocks();
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

					const validId = new ObjectId().toHexString();

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					const result = await loggedInClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const response = result.body as FileRecord;

					const body = {
						url: `http://localhost:${appPort}/file/download/${response.id}/${response.name}`,
						fileName: 'test.txt',
						headers: {
							authorization: loggedInClient.getAuthHeader(),
						},
					};

					return { validId, loggedInClient, body, user: studentUser };
				};

				it('should return status 201 for successful upload', async () => {
					const { validId, loggedInClient, body } = await setup();

					const result = await loggedInClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);

					expect(result.status).toEqual(201);
				});

				it('should return the new created file record', async () => {
					const { validId, loggedInClient, body, user } = await setup();

					const result = await loggedInClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);
					const response = result.body as FileRecord;

					expect(response).toStrictEqual(
						expect.objectContaining({
							id: expect.any(String),
							name: 'test (1).txt',
							parentId: validId,
							creatorId: user.id,
							mimeType: 'application/octet-stream',
							parentType: 'schools',
							securityCheckStatus: 'pending',
						})
					);
				});
			});

			describe(`with already existing file`, () => {
				const setup = async () => {
					jest.resetAllMocks();
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

					const validId = new ObjectId().toHexString();

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const expectedResponse1 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					const expectedResponse2 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse1).mockResolvedValueOnce(expectedResponse2);

					const result = await loggedInClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const response = result.body as FileRecord;
					const body = {
						url: `http://localhost:${appPort}/file/download/${response.id}/${response.name}`,
						fileName: 'test.txt',
						headers: {
							authorization: loggedInClient.getAuthHeader(),
						},
					};

					await loggedInClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);

					return { validId, loggedInClient, body };
				};

				it('should set iterator number to file name if file already exist', async () => {
					const { validId, loggedInClient, body } = await setup();

					const result = await loggedInClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);
					const response = result.body as FileRecord;

					expect(response.name).toEqual('test (2).txt');
				});
			});
		});
	});

	describe('download action', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const result = await testApiClient.get('/download/123/text.txt');

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = async () => {
				jest.resetAllMocks();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const result = await loggedInClient
					.post(`/upload/school/${validId}/schools/${validId}`)
					.attach('file', Buffer.from('abcd'), 'test.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const fileRecord = result.body as FileRecord;

				return { validId, loggedInClient, fileRecord };
			};

			it('should return status 400 for invalid recordId', async () => {
				const { loggedInClient } = await setup();

				const result = await loggedInClient.get('/download/123/text.txt');
				const { validationErrors } = result.body as ApiValidationError;

				expect(validationErrors).toEqual([
					{
						errors: ['fileRecordId must be a mongodb id'],
						field: ['fileRecordId'],
					},
				]);
				expect(result.status).toEqual(400);
			});

			it('should return status 404 for wrong filename', async () => {
				const { loggedInClient, fileRecord } = await setup();

				const result = await loggedInClient.get(`/download/${fileRecord.id}/wrong-name.txt`);
				const response = result.body as ApiValidationError;

				expect(response.message).toEqual(ErrorType.FILE_NOT_FOUND);
				expect(result.status).toEqual(404);
			});

			it('should return status 404 for file not found', async () => {
				const { loggedInClient } = await setup();
				const notExistingId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`/download/${notExistingId}/wrong-name.txt`);

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			describe('when mimetype is not application/pdf', () => {
				const setup = async () => {
					jest.resetAllMocks();
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

					const validId = new ObjectId().toHexString();

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const result = await loggedInClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const uploadedFile = result.body as FileRecord;

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'image/webp' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile, loggedInClient };
				};

				it('should return status 200 for successful download', async () => {
					const { uploadedFile, loggedInClient } = await setup();

					const response = await loggedInClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);

					expect(response.status).toEqual(200);
				});

				it('should return status 206 and required headers for the successful partial file stream download', async () => {
					const { uploadedFile, loggedInClient } = await setup();

					const response = await loggedInClient
						.get(`/download/${uploadedFile.id}/${uploadedFile.name}`)
						.set('Range', 'bytes=0-');
					const headers = response.headers as Record<string, string>;

					expect(response.status).toEqual(206);

					expect(headers['accept-ranges']).toMatch('bytes');
					expect(headers['content-range']).toMatch('bytes 0-3/4');
				});

				it('should set content-disposition header to attachment', async () => {
					const { uploadedFile, loggedInClient } = await setup();

					const response = await loggedInClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);
					const headers = response.headers as Record<string, string>;

					expect(headers['content-disposition']).toMatch('attachment');
				});
			});

			describe('when mimetype is application/pdf', () => {
				const setup = async () => {
					jest.resetAllMocks();
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

					const validId = new ObjectId().toHexString();

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const result = await loggedInClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const uploadedFile = result.body as FileRecord;

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'application/pdf' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile, loggedInClient };
				};

				it('should set content-disposition to inline', async () => {
					const { uploadedFile, loggedInClient } = await setup();

					const response = await loggedInClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);
					const headers = response.headers as Record<string, string>;

					expect(headers['content-disposition']).toMatch('inline');
				});
			});
		});
	});

	describe('file-security.download()', () => {
		describe('with bad request data', () => {
			const setup = () => {
				jest.resetAllMocks();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				return { loggedInClient };
			};

			it('should return status 404 for wrong token', async () => {
				const { loggedInClient } = setup();

				const response = await loggedInClient.get('/file-security/download/test-token');

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			const setup = async () => {
				jest.resetAllMocks();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser);

				const validId = new ObjectId().toHexString();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const fileApiClient = new TestApiClient(app, '');

				const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
				s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);
				const result = await loggedInClient
					.post(`/upload/school/${validId}/schools/${validId}`)
					.attach('file', Buffer.from('abcd'), 'test.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const fileRecord = result.body as FileRecord;

				const newRecord = await em.findOneOrFail(FileRecord, { id: fileRecord.id });

				return { newRecord, fileApiClient };
			};

			it('should return status 200 for successful download', async () => {
				const { newRecord, fileApiClient } = await setup();

				const response = await fileApiClient.get(
					`/file-security/download/${newRecord.securityCheck.requestToken || ''}`
				);

				expect(response.status).toEqual(200);
			});
		});
	});
});
