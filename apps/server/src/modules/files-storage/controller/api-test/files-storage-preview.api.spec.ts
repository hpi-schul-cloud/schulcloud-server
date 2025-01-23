import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { PreviewProducer } from '@infra/preview-generator';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication, NotFoundException, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import NodeClam from 'clamscan';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { FileRecord, ScanStatus } from '../../entity';
import { ErrorType } from '../../error';
import { FilesStorageTestModule } from '../../files-storage-test.module';
import { FILES_STORAGE_S3_CONNECTION } from '../../files-storage.config';
import { TestHelper } from '../../helper/test-helper';
import { PreviewWidth } from '../../interface';
import { PreviewOutputMimeTypes } from '../../interface/preview-output-mime-types.enum';
import { FileRecordResponse } from '../dto';

jest.mock('file-type-cjs/file-type-cjs-index', () => {
	return {
		fileTypeStream: jest.fn(),
	};
});

const createRndInt = (max) => Math.floor(Math.random() * max);

const defaultQueryParameters = {
	width: PreviewWidth.WIDTH_500,
	outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
};

describe('File Controller (API) - preview', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let antivirusService: DeepMocked<AntivirusService>;
	let uploadPath: string;

	beforeAll(async () => {
		const appPort = 10000 + createRndInt(10000);

		module = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideProvider(PreviewProducer)
			.useValue(createMock<PreviewProducer>())
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
		antivirusService = module.get(AntivirusService);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	const setScanStatus = async (fileRecordId: EntityId, status: ScanStatus) => {
		const fileRecord = await em.findOneOrFail(FileRecord, fileRecordId);
		fileRecord.securityCheck.status = status;
		await em.flush();
	};

	const setupApiClient = async () => {
		const school = schoolEntityFactory.build();
		const { studentUser: user, studentAccount: account } = UserAndAccountTestFactory.buildStudent({ school });

		await em.persistAndFlush([school, user, account]);
		em.clear();

		const authValue = JwtAuthenticationFactory.createJwt({
			accountId: account.id,
			userId: user.id,
			schoolId: user.school.id,
			roles: [user.roles[0].id],
			support: false,
			isExternalUser: false,
		});
		const apiClient = new TestApiClient(app, '/file', authValue);

		const schoolId = school.id;
		uploadPath = `/upload/school/${schoolId}/schools/${schoolId}`;

		jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));
		antivirusService.checkStream.mockResolvedValueOnce({ virus_detected: false });

		return apiClient;
	};

	const uploadFile = async (apiClient: TestApiClient) => {
		const uploadResponse = await apiClient
			.post(uploadPath)
			.attach('file', Buffer.from('abcd'), 'test.png')
			.set('connection', 'keep-alive')
			.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
			.query({});
		const uploadedFile = uploadResponse.body as FileRecordResponse;

		return uploadedFile;
	};

	describe('preview', () => {
		describe('with not authenticated user', () => {
			it('should return status 401', async () => {
				const apiClient = new TestApiClient(app, '/file');

				const response = await apiClient.get('/preview/123/test.png').query(defaultQueryParameters);

				expect(response.status).toEqual(401);
			});
		});

		describe('with bad request data', () => {
			describe('WHEN recordId is invalid', () => {
				it('should return status 400', async () => {
					const apiClient = await setupApiClient();
					const response = await apiClient.get('/preview/123/test.png').query(defaultQueryParameters);
					const result = response.body as ApiValidationError;

					expect(result.validationErrors).toEqual([
						{
							errors: ['fileRecordId must be a mongodb id'],
							field: ['fileRecordId'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN width is other than PreviewWidth Enum', () => {
				it('should return status 400', async () => {
					const apiClient = await setupApiClient();
					const uploadedFile = await uploadFile(apiClient);

					const query = {
						...defaultQueryParameters,
						width: 2000,
					};
					const response = await apiClient.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`).query(query);
					const result = response.body as ApiValidationError;

					expect(result.validationErrors).toEqual([
						{
							errors: ['width must be one of the following values: 500'],
							field: ['width'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN output format is wrong', () => {
				it('should return status 400', async () => {
					const apiClient = await setupApiClient();
					const uploadedFile = await uploadFile(apiClient);

					const query = { ...defaultQueryParameters, outputFormat: 'image/txt' };
					const response = await apiClient.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`).query(query);
					const result = response.body as ApiValidationError;

					expect(result.validationErrors).toEqual([
						{
							errors: ['outputFormat must be one of the following values: image/webp'],
							field: ['outputFormat'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN file does not exist', () => {
				it('should return status 404', async () => {
					const apiClient = await setupApiClient();
					const uploadedFile = await uploadFile(apiClient);

					const wrongId = new ObjectId().toString();
					const response = await apiClient
						.get(`/preview/${wrongId}/${uploadedFile.name}`)
						.query(defaultQueryParameters);
					const result = response.body as ApiValidationError;

					expect(result.message).toEqual('The requested FileRecord: [object Object] has not been found.');
					expect(response.status).toEqual(404);
				});
			});

			describe('WHEN filename is wrong', () => {
				it('should return status 404', async () => {
					const apiClient = await setupApiClient();
					const uploadedFile = await uploadFile(apiClient);
					await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

					const error = new NotFoundException();
					s3ClientAdapter.get.mockRejectedValueOnce(error);

					const response = await apiClient
						.get(`/preview/${uploadedFile.id}/wrong-name.txt`)
						.query(defaultQueryParameters);
					const result = response.body as ApiValidationError;

					expect(result.message).toEqual(ErrorType.FILE_NOT_FOUND);
					expect(response.status).toEqual(404);
				});
			});
		});

		describe(`with valid request data`, () => {
			describe('WHEN preview does already exist', () => {
				describe('WHEN forceUpdate is undefined', () => {
					const setup = async () => {
						const apiClient = await setupApiClient();
						const uploadedFile = await uploadFile(apiClient);
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const previewFile = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { apiClient, uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { apiClient, uploadedFile } = await setup();
						const buffer = Buffer.from('testText');

						const response = await apiClient
							.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
							.query(defaultQueryParameters);
						const result = response.body as StreamableFile;

						expect(response.status).toEqual(200);
						expect(result).toEqual(buffer);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { apiClient, uploadedFile } = await setup();

						const response = await apiClient
							.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
							.set('Range', 'bytes=0-')
							.query(defaultQueryParameters);
						const headers = response.headers as Record<string, string>;

						expect(response.status).toEqual(206);
						expect(headers['accept-ranges']).toMatch('bytes');
						expect(headers['content-range']).toMatch('bytes 0-3/4');
					});
				});

				describe('WHEN forceUpdate is false', () => {
					const setup = async () => {
						const apiClient = await setupApiClient();
						const uploadedFile = await uploadFile(apiClient);
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const previewFile = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { apiClient, uploadedFile };
					};

					describe('WHEN header contains no etag', () => {
						it('should return status 200 for successful download', async () => {
							const { apiClient, uploadedFile } = await setup();
							const query = {
								...defaultQueryParameters,
								forceUpdate: false,
							};

							const response = await apiClient.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`).query(query);

							expect(response.status).toEqual(200);
						});

						it('should return status 206 and required headers for the successful partial file stream download', async () => {
							const { apiClient, uploadedFile } = await setup();
							const query = {
								...defaultQueryParameters,
								forceUpdate: false,
							};

							const response = await apiClient
								.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
								.set('Range', 'bytes=0-')
								.query(query);
							const headers = response.headers as Record<string, string>;

							expect(response.status).toEqual(206);
							expect(headers['accept-ranges']).toMatch('bytes');
							expect(headers['content-range']).toMatch('bytes 0-3/4');
							expect(headers.etag).toMatch('testTag');
						});
					});

					describe('WHEN header contains not matching etag', () => {
						it('should return status 200 for successful download', async () => {
							const { apiClient, uploadedFile } = await setup();
							const query = {
								...defaultQueryParameters,
								forceUpdate: false,
							};
							const etag = 'otherTag';

							const response = await apiClient
								.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
								.query(query)
								.set('If-None-Match', etag);

							expect(response.status).toEqual(200);
						});
					});

					describe('WHEN header contains matching etag', () => {
						it('should return status 304', async () => {
							const { apiClient, uploadedFile } = await setup();
							const query = {
								...defaultQueryParameters,
								forceUpdate: false,
							};
							const etag = 'testTag';

							const response = await apiClient
								.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
								.query(query)
								.set('If-None-Match', etag);

							expect(response.status).toEqual(304);
						});
					});
				});

				describe('WHEN forceUpdate is true', () => {
					const setup = async () => {
						const apiClient = await setupApiClient();
						const uploadedFile = await uploadFile(apiClient);
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const previewFile = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { apiClient, uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { apiClient, uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
							forceUpdate: true,
						};

						const response = await apiClient.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`).query(query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { apiClient, uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
							forceUpdate: true,
						};

						const response = await apiClient
							.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
							.set('Range', 'bytes=0-')
							.query(query);
						const headers = response.headers as Record<string, string>;

						expect(response.status).toEqual(206);
						expect(headers['accept-ranges']).toMatch('bytes');
						expect(headers['content-range']).toMatch('bytes 0-3/4');
						expect(headers.etag).toMatch('testTag');
					});
				});

				describe('WHEN preview does not already exist', () => {
					const setup = async () => {
						const apiClient = await setupApiClient();
						const uploadedFile = await uploadFile(apiClient);
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const error = new NotFoundException();
						const previewFile = TestHelper.createFile({ contentRange: 'bytes 0-3/4' });
						s3ClientAdapter.get.mockRejectedValueOnce(error).mockResolvedValueOnce(previewFile);

						return { apiClient, uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { apiClient, uploadedFile } = await setup();

						const response = await apiClient
							.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
							.query(defaultQueryParameters);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { apiClient, uploadedFile } = await setup();

						const response = await apiClient
							.get(`/preview/${uploadedFile.id}/${uploadedFile.name}`)
							.set('Range', 'bytes=0-')
							.query(defaultQueryParameters);
						const headers = response.headers as Record<string, string>;

						expect(response.status).toEqual(206);
						expect(headers['accept-ranges']).toMatch('bytes');
						expect(headers['content-range']).toMatch('bytes 0-3/4');
					});
				});
			});
		});
	});
});
