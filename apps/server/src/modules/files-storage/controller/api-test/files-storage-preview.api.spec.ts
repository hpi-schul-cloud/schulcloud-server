import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FilesStorageTestModule } from '@src/modules/files-storage';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { Request } from 'express';
import request from 'supertest';
import { S3ClientAdapter } from '../../client/s3-client.adapter';
import { ErrorType } from '../../error';
import { TestHelper } from '../../helper/test-helper';
import { PreviewOutputMimeTypes } from '../../interface/preview-output-mime-types.enum';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async postUploadFile(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.post(routeName)
			.attach('file', Buffer.from('abcd'), 'test.png')
			.set('connection', 'keep-alive')
			.set('content-type', 'multipart/form-data; boundary=----WebKitFormBoundaryiBMuOC0HyZ3YnA20')
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getPreview(routeName: string, query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(routeName)
			.query(query || {});

		return {
			result: response.body as FileRecordResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}

	async getPreviewBytesRange(routeName: string, bytesRange: string, query?: string | Record<string, unknown>) {
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

describe('File Controller (API) - preview', () => {
	let module: TestingModule;
	let app: INestApplication;
	let em: EntityManager;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let currentUser: ICurrentUser;
	let api: API;
	let schoolId: EntityId;
	let appPort: number;
	let uploadPath: string;

	beforeAll(async () => {
		appPort = 10000 + createRndInt(10000);

		module = await Test.createTestingModule({
			imports: [FilesStorageTestModule],
		})
			.overrideProvider(AntivirusService)
			.useValue(createMock<AntivirusService>())
			.overrideProvider(S3ClientAdapter)
			.useValue(createMock<S3ClientAdapter>())
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
		const a = await app.init();
		await a.listen(appPort);

		em = module.get(EntityManager);
		s3ClientAdapter = module.get(S3ClientAdapter);
		api = new API(app);
	});

	afterAll(async () => {
		await app.close();
		await module.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
		const school = schoolFactory.build();
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.FILESTORAGE_CREATE, Permission.FILESTORAGE_VIEW],
		});
		const user = userFactory.build({ school, roles });

		await em.persistAndFlush([user, school]);
		em.clear();
		schoolId = school.id;
		currentUser = mapUserToCurrentUser(user);
		uploadPath = `/file/upload/${schoolId}/schools/${schoolId}`;
	});

	describe('preview', () => {
		describe('with bad request data', () => {
			describe('WHEN recordId is invalid', () => {
				it('should return status 400', async () => {
					const query = { width: 200, height: 200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview('/file/preview/123/test.png', query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['fileRecordId must be a mongodb id'],
							field: ['fileRecordId'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN width below min value (0)', () => {
				it('should return status 400', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const query = { width: -200, height: 200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['width must not be less than 1'],
							field: ['width'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN width above max value (2000)', () => {
				it('should return status 400', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const query = { width: 2100, height: 200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['width must not be greater than 2000'],
							field: ['width'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN height below min value (0)', () => {
				it('should return status 400', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const query = { width: 200, height: -200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['height must not be less than 1'],
							field: ['height'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN height above max value (2000)', () => {
				it('should return status 400', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const query = { width: 200, height: 2100, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['height must not be greater than 2000'],
							field: ['height'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN output format is wrong', () => {
				it('should return status 400', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const query = { width: 200, height: 200, outputFormat: 'image/txt' };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
						{
							errors: ['outputFormat must be one of the following values: image/webp, image/jpeg, image/png'],
							field: ['outputFormat'],
						},
					]);
					expect(response.status).toEqual(400);
				});
			});

			describe('WHEN file does not exist', () => {
				it('should return status 404', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const wrongId = new ObjectId().toString();
					const query = { width: 200, height: 200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${wrongId}/${result.name}`, query);

					expect(response.error.message).toEqual('The requested FileRecord: [object Object] has not been found.');
					expect(response.status).toEqual(404);
				});
			});

			describe('WHEN filename is wrong', () => {
				it('should return status 404', async () => {
					const { result } = await api.postUploadFile(uploadPath);
					const error = new NotFoundException();
					s3ClientAdapter.get.mockRejectedValueOnce(error);
					const query = { width: 200, height: 200, outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };

					const response = await api.getPreview(`/file/preview/${result.id}/wrong-name.txt`, query);

					expect(response.error.message).toEqual(ErrorType.FILE_NOT_FOUND);
					expect(response.status).toEqual(404);
				});
			});
		});

		describe(`with valid request data`, () => {
			describe('WHEN preview does already exist', () => {
				describe('WHEN forceUpdate is undefined', () => {
					const setup = async () => {
						const { result: uploadedFile } = await api.postUploadFile(uploadPath);

						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
						};

						const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
						};

						const response = await api.getPreviewBytesRange(
							`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
							'bytes=0-',
							query
						);

						expect(response.status).toEqual(206);
						expect(response.headers['accept-ranges']).toMatch('bytes');
						expect(response.headers['content-range']).toMatch('bytes 0-3/4');
					});
				});

				describe('WHEN forceUpdate is false', () => {
					const setup = async () => {
						const { result: uploadedFile } = await api.postUploadFile(uploadPath);

						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
							forceUpdate: false,
						};

						const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
							forceUpdate: false,
						};

						const response = await api.getPreviewBytesRange(
							`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
							'bytes=0-',
							query
						);

						expect(response.status).toEqual(206);
						expect(response.headers['accept-ranges']).toMatch('bytes');
						expect(response.headers['content-range']).toMatch('bytes 0-3/4');
					});
				});

				describe('WHEN forceUpdate is true', () => {
					const setup = async () => {
						const { result: uploadedFile } = await api.postUploadFile(uploadPath);

						const originalFile = TestHelper.createFile();
						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(originalFile).mockResolvedValueOnce(previewFile);

						return { uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
							forceUpdate: true,
						};

						const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							width: 200,
							height: 200,
							outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
							forceUpdate: true,
						};

						const response = await api.getPreviewBytesRange(
							`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
							'bytes=0-',
							query
						);

						expect(response.status).toEqual(206);
						expect(response.headers['accept-ranges']).toMatch('bytes');
						expect(response.headers['content-range']).toMatch('bytes 0-3/4');
					});
				});
			});

			describe('WHEN preview does not already exist', () => {
				const setup = async () => {
					const { result: uploadedFile } = await api.postUploadFile(uploadPath);

					const error = new NotFoundException();
					const originalFile = TestHelper.createFile();
					const previewFile = TestHelper.createFile('bytes 0-3/4');
					s3ClientAdapter.get
						.mockRejectedValueOnce(error)
						.mockResolvedValueOnce(originalFile)
						.mockResolvedValueOnce(previewFile);

					return { uploadedFile };
				};

				it('should return status 200 for successful download', async () => {
					const { uploadedFile } = await setup();
					const query = {
						width: 200,
						height: 200,
						outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
					};

					const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

					expect(response.status).toEqual(200);
				});

				it('should return status 206 and required headers for the successful partial file stream download', async () => {
					const { uploadedFile } = await setup();
					const query = {
						width: 200,
						height: 200,
						outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
					};

					const response = await api.getPreviewBytesRange(
						`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
						'bytes=0-',
						query
					);

					expect(response.status).toEqual(206);
					expect(response.headers['accept-ranges']).toMatch('bytes');
					expect(response.headers['content-range']).toMatch('bytes 0-3/4');
				});
			});
		});
	});
});
