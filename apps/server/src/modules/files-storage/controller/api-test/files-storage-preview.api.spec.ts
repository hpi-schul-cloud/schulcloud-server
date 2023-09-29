import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication, NotFoundException, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { EntityId, Permission } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { cleanupCollections, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { FILES_STORAGE_S3_CONNECTION, FilesStorageTestModule } from '@src/modules/files-storage';
import { FileRecordResponse } from '@src/modules/files-storage/controller/dto';
import { Request } from 'express';
import FileType from 'file-type-cjs/file-type-cjs-index';
import request from 'supertest';
import { FileRecord, ScanStatus } from '../../entity';
import { ErrorType } from '../../error';
import { TestHelper } from '../../helper/test-helper';
import { PreviewWidth } from '../../interface';
import { PreviewOutputMimeTypes } from '../../interface/preview-output-mime-types.enum';

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
			result: response.body as StreamableFile,
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
			result: response.body as StreamableFile,
			error: response.body as ApiValidationError,
			status: response.status,
			headers: response.headers as Record<string, string>,
		};
	}
}

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

		jest.spyOn(FileType, 'fileTypeStream').mockImplementation((readable) => Promise.resolve(readable));
	});

	const setScanStatus = async (fileRecordId: EntityId, status: ScanStatus) => {
		const fileRecord = await em.findOneOrFail(FileRecord, fileRecordId);
		fileRecord.securityCheck.status = status;
		await em.flush();
	};

	describe('preview', () => {
		describe('with bad request data', () => {
			describe('WHEN recordId is invalid', () => {
				it('should return status 400', async () => {
					const response = await api.getPreview('/file/preview/123/test.png', defaultQueryParameters);

					expect(response.error.validationErrors).toEqual([
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
					const { result } = await api.postUploadFile(uploadPath);
					const query = {
						...defaultQueryParameters,
						width: 2000,
					};

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
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
					const { result } = await api.postUploadFile(uploadPath);
					const query = { ...defaultQueryParameters, outputFormat: 'image/txt' };

					const response = await api.getPreview(`/file/preview/${result.id}/${result.name}`, query);

					expect(response.error.validationErrors).toEqual([
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
					const { result } = await api.postUploadFile(uploadPath);
					const wrongId = new ObjectId().toString();

					const response = await api.getPreview(`/file/preview/${wrongId}/${result.name}`, defaultQueryParameters);

					expect(response.error.message).toEqual('The requested FileRecord: [object Object] has not been found.');
					expect(response.status).toEqual(404);
				});
			});

			describe('WHEN filename is wrong', () => {
				const setup = async () => {
					const { result } = await api.postUploadFile(uploadPath);
					await setScanStatus(result.id, ScanStatus.VERIFIED);
					const error = new NotFoundException();
					s3ClientAdapter.get.mockRejectedValueOnce(error);

					return { result };
				};

				it('should return status 404', async () => {
					const { result } = await setup();

					const response = await api.getPreview(`/file/preview/${result.id}/wrong-name.txt`, defaultQueryParameters);

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
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { uploadedFile, previewFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const buffer = Buffer.from('testText');

						const response = await api.getPreview(
							`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
							defaultQueryParameters
						);

						expect(response.status).toEqual(200);
						expect(response.result).toEqual(buffer);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();

						const response = await api.getPreviewBytesRange(
							`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
							'bytes=0-',
							defaultQueryParameters
						);

						expect(response.status).toEqual(206);
						expect(response.headers['accept-ranges']).toMatch('bytes');
						expect(response.headers['content-range']).toMatch('bytes 0-3/4');
					});
				});

				describe('WHEN forceUpdate is false', () => {
					const setup = async () => {
						const { result: uploadedFile } = await api.postUploadFile(uploadPath);
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(previewFile);

						return { uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
							forceUpdate: false,
						};

						const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
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
						await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

						const originalFile = TestHelper.createFile();
						const previewFile = TestHelper.createFile('bytes 0-3/4');
						s3ClientAdapter.get.mockResolvedValueOnce(originalFile).mockResolvedValueOnce(previewFile);

						return { uploadedFile };
					};

					it('should return status 200 for successful download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
							forceUpdate: true,
						};

						const response = await api.getPreview(`/file/preview/${uploadedFile.id}/${uploadedFile.name}`, query);

						expect(response.status).toEqual(200);
					});

					it('should return status 206 and required headers for the successful partial file stream download', async () => {
						const { uploadedFile } = await setup();
						const query = {
							...defaultQueryParameters,
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
					await setScanStatus(uploadedFile.id, ScanStatus.VERIFIED);

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

					const response = await api.getPreview(
						`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
						defaultQueryParameters
					);

					expect(response.status).toEqual(200);
				});

				it('should return status 206 and required headers for the successful partial file stream download', async () => {
					const { uploadedFile } = await setup();

					const response = await api.getPreviewBytesRange(
						`/file/preview/${uploadedFile.id}/${uploadedFile.name}`,
						'bytes=0-',
						defaultQueryParameters
					);

					expect(response.status).toEqual(206);
					expect(response.headers['accept-ranges']).toMatch('bytes');
					expect(response.headers['content-range']).toMatch('bytes 0-3/4');
				});
			});
		});
	});
});
