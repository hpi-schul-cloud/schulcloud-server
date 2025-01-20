import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { cleanupCollections } from '@testing/cleanup-collections';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
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
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	describe('upload action', () => {
		const setup = async () => {
			jest.resetAllMocks();
			await cleanupCollections(em);
			const school = schoolEntityFactory.build();
			const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

			await em.persistAndFlush([user, school, account]);
			em.clear();
			const validId = school.id;

			jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

			const authValue = JwtAuthenticationFactory.createJwt({
				accountId: account.id,
				userId: user.id,
				schoolId: user.school.id,
				roles: [user.roles[0].id],
				support: false,
				isExternalUser: false,
			});
			const apiClient = new TestApiClient(app, baseRouteName, authValue);

			return { validId, apiClient, user };
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
				const { validId } = await setup();
				const apiClient = new TestApiClient(app, baseRouteName);

				const result = await uploadFile(`/upload/school/123/users/${validId}`, apiClient);

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			it('should return status 400 for invalid schoolId', async () => {
				const { apiClient, validId } = await setup();

				const result = await uploadFile(`/upload/school/123/users/${validId}`, apiClient);

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
				const { apiClient, validId } = await setup();

				const result = await uploadFile(`/upload/school/${validId}/users/123`, apiClient);

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
				const { apiClient, validId } = await setup();

				const result = await uploadFile(`/upload/school/${validId}/cookies/${validId}`, apiClient);

				expect(result.status).toEqual(400);
			});
		});

		describe(`with valid request data`, () => {
			it('should return status 201 for successful upload', async () => {
				const { apiClient, validId } = await setup();

				const response = await uploadFile(`upload/school/${validId}/schools/${validId}`, apiClient);

				expect(response.status).toEqual(201);
			});

			it('should return the new created file record', async () => {
				const { apiClient, validId, user } = await setup();

				const result = await uploadFile(`/upload/school/${validId}/schools/${validId}`, apiClient);
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
				const { apiClient, validId } = await setup();

				await uploadFile(`/upload/school/${validId}/schools/${validId}`, apiClient);

				const result = await uploadFile(`/upload/school/${validId}/schools/${validId}`, apiClient);
				const response = result.body as FileRecord;

				expect(response.name).toEqual('test (1).txt');
			});
		});
	});

	describe('upload from url action', () => {
		describe('with not authenticated user', () => {
			const setup = () => {
				const apiClient = new TestApiClient(app, baseRouteName);

				const body = {
					url: 'http://localhost/test.txt',
					fileName: 'test.txt',
				};

				return { apiClient, body };
			};

			it('should return status 401', async () => {
				const { apiClient, body } = setup();

				const response = await apiClient.post(`/upload-from-url/school/123/users/123`, body);

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = async () => {
				jest.resetAllMocks();
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([user, school, account]);
				em.clear();
				const validId = school.id;

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: account.id,
					userId: user.id,
					schoolId: user.school.id,
					roles: [user.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, baseRouteName, authValue);

				const body = {
					url: 'http://localhost/test.txt',
					fileName: 'test.txt',
				};

				return { validId, apiClient, body };
			};

			it('should return status 400 for invalid schoolId', async () => {
				const { apiClient, validId, body } = await setup();

				const response = await apiClient.post(`/upload-from-url/school/123/users/${validId}`, body);
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
				const { apiClient, validId, body } = await setup();

				const response = await apiClient.post(`/upload-from-url/school/${validId}/users/123`, body);
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
				const { apiClient, validId, body } = await setup();

				const response = await apiClient.post(`/upload-from-url/school/${validId}/cookies/${validId}`, body);
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
				const { validId, apiClient } = await setup();

				const response = await apiClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, {});
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
					await cleanupCollections(em);
					const school = schoolEntityFactory.build();
					const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([user, school, account]);
					em.clear();
					const validId = school.id;

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const authValue = JwtAuthenticationFactory.createJwt({
						accountId: account.id,
						userId: user.id,
						schoolId: user.school.id,
						roles: [user.roles[0].id],
						support: false,
						isExternalUser: false,
					});
					const apiClient = new TestApiClient(app, baseRouteName, authValue);

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					const result = await apiClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const response = result.body as FileRecord;

					const body = {
						url: `http://localhost:${appPort}/file/download/${response.id}/${response.name}`,
						fileName: 'test.txt',
						headers: {
							authorization: `Bearer ${authValue}`,
						},
					};

					return { validId, apiClient, body, user };
				};

				it('should return status 201 for successful upload', async () => {
					const { validId, apiClient, body } = await setup();

					const result = await apiClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);

					expect(result.status).toEqual(201);
				});

				it('should return the new created file record', async () => {
					const { validId, apiClient, body, user } = await setup();

					const result = await apiClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);
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
					await cleanupCollections(em);
					const school = schoolEntityFactory.build();
					const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([user, school, account]);
					em.clear();
					const validId = school.id;

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const authValue = JwtAuthenticationFactory.createJwt({
						accountId: account.id,
						userId: user.id,
						schoolId: user.school.id,
						roles: [user.roles[0].id],
						support: false,
						isExternalUser: false,
					});
					const apiClient = new TestApiClient(app, baseRouteName, authValue);

					const expectedResponse1 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
					const expectedResponse2 = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse1).mockResolvedValueOnce(expectedResponse2);

					const result = await apiClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const response = result.body as FileRecord;
					const body = {
						url: `http://localhost:${appPort}/file/download/${response.id}/${response.name}`,
						fileName: 'test.txt',
						headers: {
							authorization: `Bearer ${authValue}`,
						},
					};

					await apiClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);

					return { validId, apiClient, body };
				};

				it('should set iterator number to file name if file already exist', async () => {
					const { validId, apiClient, body } = await setup();

					const result = await apiClient.post(`/upload-from-url/school/${validId}/schools/${validId}`, body);
					const response = result.body as FileRecord;

					expect(response.name).toEqual('test (2).txt');
				});
			});
		});
	});

	describe('download action', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const apiClient = new TestApiClient(app, baseRouteName);

				const result = await apiClient.get('/download/123/text.txt');

				expect(result.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			const setup = async () => {
				jest.resetAllMocks();
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([user, school, account]);
				em.clear();
				const validId = school.id;

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: account.id,
					userId: user.id,
					schoolId: user.school.id,
					roles: [user.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, baseRouteName, authValue);

				const result = await apiClient
					.post(`/upload/school/${validId}/schools/${validId}`)
					.attach('file', Buffer.from('abcd'), 'test.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const fileRecord = result.body as FileRecord;

				return { validId, apiClient, fileRecord };
			};

			it('should return status 400 for invalid recordId', async () => {
				const { apiClient } = await setup();

				const result = await apiClient.get('/download/123/text.txt');
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
				const { apiClient, fileRecord } = await setup();

				const result = await apiClient.get(`/download/${fileRecord.id}/wrong-name.txt`);
				const response = result.body as ApiValidationError;

				expect(response.message).toEqual(ErrorType.FILE_NOT_FOUND);
				expect(result.status).toEqual(404);
			});

			it('should return status 404 for file not found', async () => {
				const { apiClient } = await setup();
				const notExistingId = new ObjectId().toHexString();

				const response = await apiClient.get(`/download/${notExistingId}/wrong-name.txt`);

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			describe('when mimetype is not application/pdf', () => {
				const setup = async () => {
					jest.resetAllMocks();
					await cleanupCollections(em);
					const school = schoolEntityFactory.build();
					const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([user, school, account]);
					em.clear();
					const validId = school.id;

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const authValue = JwtAuthenticationFactory.createJwt({
						accountId: account.id,
						userId: user.id,
						schoolId: user.school.id,
						roles: [user.roles[0].id],
						support: false,
						isExternalUser: false,
					});
					const apiClient = new TestApiClient(app, baseRouteName, authValue);

					const result = await apiClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const uploadedFile = result.body as FileRecord;

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'image/webp' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile, apiClient };
				};

				it('should return status 200 for successful download', async () => {
					const { uploadedFile, apiClient } = await setup();

					const response = await apiClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);

					expect(response.status).toEqual(200);
				});

				it('should return status 206 and required headers for the successful partial file stream download', async () => {
					const { uploadedFile, apiClient } = await setup();

					const response = await apiClient
						.get(`/download/${uploadedFile.id}/${uploadedFile.name}`)
						.set('Range', 'bytes=0-');
					const headers = response.headers as Record<string, string>;

					expect(response.status).toEqual(206);

					expect(headers['accept-ranges']).toMatch('bytes');
					expect(headers['content-range']).toMatch('bytes 0-3/4');
				});

				it('should set content-disposition header to attachment', async () => {
					const { uploadedFile, apiClient } = await setup();

					const response = await apiClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);
					const headers = response.headers as Record<string, string>;

					expect(headers['content-disposition']).toMatch('attachment');
				});
			});

			describe('when mimetype is application/pdf', () => {
				const setup = async () => {
					jest.resetAllMocks();
					await cleanupCollections(em);
					const school = schoolEntityFactory.build();
					const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([user, school, account]);
					em.clear();
					const validId = school.id;

					jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

					const authValue = JwtAuthenticationFactory.createJwt({
						accountId: account.id,
						userId: user.id,
						schoolId: user.school.id,
						roles: [user.roles[0].id],
						support: false,
						isExternalUser: false,
					});
					const apiClient = new TestApiClient(app, baseRouteName, authValue);

					const result = await apiClient
						.post(`/upload/school/${validId}/schools/${validId}`)
						.attach('file', Buffer.from('abcd'), 'test.txt')
						.set('connection', 'keep-alive')
						.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
					const uploadedFile = result.body as FileRecord;

					const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4', mimeType: 'application/pdf' });

					s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);

					return { uploadedFile, apiClient };
				};

				it('should set content-disposition to inline', async () => {
					const { uploadedFile, apiClient } = await setup();

					const response = await apiClient.get(`/download/${uploadedFile.id}/${uploadedFile.name}`);
					const headers = response.headers as Record<string, string>;

					expect(headers['content-disposition']).toMatch('inline');
				});
			});
		});
	});

	describe('file-security.download()', () => {
		describe('with bad request data', () => {
			const setup = async () => {
				jest.resetAllMocks();
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([user, school, account]);
				em.clear();

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: account.id,
					userId: user.id,
					schoolId: user.school.id,
					roles: [user.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const apiClient = new TestApiClient(app, '', authValue);

				return { apiClient };
			};

			it('should return status 404 for wrong token', async () => {
				const { apiClient } = await setup();

				const response = await apiClient.get('/file-security/download/test-token');

				expect(response.status).toEqual(404);
			});
		});

		describe(`with valid request data`, () => {
			const setup = async () => {
				jest.resetAllMocks();
				await cleanupCollections(em);
				const school = schoolEntityFactory.build();
				const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([user, school, account]);
				em.clear();

				const validId = school.id;

				jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));

				const authValue = JwtAuthenticationFactory.createJwt({
					accountId: account.id,
					userId: user.id,
					schoolId: user.school.id,
					roles: [user.roles[0].id],
					support: false,
					isExternalUser: false,
				});
				const fileApiClient = new TestApiClient(app, baseRouteName, authValue);
				const apiClient = new TestApiClient(app, '', authValue);

				const expectedResponse = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
				s3ClientAdapter.get.mockResolvedValueOnce(expectedResponse);
				const result = await fileApiClient
					.post(`/upload/school/${validId}/schools/${validId}`)
					.attach('file', Buffer.from('abcd'), 'test.txt')
					.set('connection', 'keep-alive')
					.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20');
				const fileRecord = result.body as FileRecord;

				const newRecord = await em.findOneOrFail(FileRecord, { id: fileRecord.id });

				return { newRecord, apiClient };
			};

			it('should return status 200 for successful download', async () => {
				const { newRecord, apiClient } = await setup();

				const response = await apiClient.get(`/file-security/download/${newRecord.securityCheck.requestToken || ''}`);

				expect(response.status).toEqual(200);
			});
		});
	});
});
