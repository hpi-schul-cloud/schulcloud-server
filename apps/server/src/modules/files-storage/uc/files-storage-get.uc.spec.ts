import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationReferenceService } from '@modules/authorization/domain';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { DomainErrorHandler } from '@src/core';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		schoolId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationReferenceService: DeepMocked<AuthorizationReferenceService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
				{
					provide: AntivirusService,
					useValue: createMock<AntivirusService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
				},
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationReferenceService = module.get(AuthorizationReferenceService);
		filesStorageService = module.get(FilesStorageService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(filesStorageUC).toBeDefined();
	});

	describe('getFileRecordsOfParent is called', () => {
		describe('when user is authorised and valid files exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecords, params } = buildFileRecordsWithParams();

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { userId, params } = setup();

				await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(authorizationReferenceService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					params.parentType,
					params.parentId,
					FileStorageAuthorizationContext.read
				);
			});

			it('should call service method getFilesOfParent with right parameters', async () => {
				const { userId, params } = setup();

				await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledWith(params.parentId);
			});

			it('should return counted file records', async () => {
				const { userId, params, fileRecords } = setup();

				const result = await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(result).toEqual([fileRecords, fileRecords.length]);
			});
		});

		describe('when user is not authorised', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { fileRecords, params } = buildFileRecordsWithParams();

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new Error('Bla'));

				return { userId, params, fileRecords };
			};

			it('should pass the error', async () => {
				const { userId, params } = setup();

				await expect(filesStorageUC.getFileRecordsOfParent(userId, params)).rejects.toThrowError(new Error('Bla'));
			});
		});

		describe('when user is authorised but no files exist', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const { params } = buildFileRecordsWithParams();
				const fileRecords = [];

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should return empty counted file records', async () => {
				const { userId, params } = setup();

				const result = await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(result).toEqual([[], 0]);
			});
		});
	});

	describe('getPublicConfig', () => {
		describe('when service is aviable', () => {
			const setup = () => {
				const fileSize = 500;
				filesStorageService.getMaxFileSize.mockReturnValueOnce(fileSize);

				const expectedResult = {
					MAX_FILE_SIZE: fileSize,
				};

				return { expectedResult };
			};

			it('should be create a config response dto', () => {
				const { expectedResult } = setup();

				const result = filesStorageUC.getPublicConfig();

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when service throw an error', () => {
			const setup = () => {
				const error = new Error('Service throw error');
				filesStorageService.getMaxFileSize.mockImplementationOnce(() => {
					throw error;
				});

				return { error };
			};

			it('should be create a config response dto', () => {
				const { error } = setup();

				expect(() => filesStorageUC.getPublicConfig()).toThrowError(error);
			});
		});
	});
});
