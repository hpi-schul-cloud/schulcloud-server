import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AntivirusService } from '@infra/antivirus';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { DomainErrorHandler } from '@src/core';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FileRecordParentType, StorageLocation } from '../interface';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FilesStorageUC } from './files-storage.uc';

const buildFileRecordsWithParams = () => {
	const userId = new ObjectId().toHexString();
	const storageLocationId = new ObjectId().toHexString();

	const fileRecords = [
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-two.txt' }),
		fileRecordFactory.buildWithId({ parentId: userId, storageLocationId, name: 'text-tree.txt' }),
	];

	const params: FileRecordParams = {
		storageLocation: StorageLocation.SCHOOL,
		storageLocationId,
		parentId: userId,
		parentType: FileRecordParentType.User,
	};

	return { params, fileRecords, userId };
};

describe('FilesStorageUC', () => {
	let module: TestingModule;
	let filesStorageUC: FilesStorageUC;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

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
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
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
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
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
				const { fileRecords, params } = buildFileRecordsWithParams();

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { params } = setup();

				await filesStorageUC.getFileRecordsOfParent(params);

				expect(authorizationClientAdapter.checkPermissionsByReference).toHaveBeenCalledWith(
					params.parentType,
					params.parentId,
					FileStorageAuthorizationContext.read
				);
			});

			it('should call service method getFilesOfParent with right parameters', async () => {
				const { params } = setup();

				await filesStorageUC.getFileRecordsOfParent(params);

				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledWith(params.parentId);
			});

			it('should return counted file records', async () => {
				const { params, fileRecords } = setup();

				const result = await filesStorageUC.getFileRecordsOfParent(params);

				expect(result).toEqual([fileRecords, fileRecords.length]);
			});
		});

		describe('when user is not authorised', () => {
			const setup = () => {
				const { fileRecords, params } = buildFileRecordsWithParams();

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new Error('Bla'));

				return { params, fileRecords };
			};

			it('should pass the error', async () => {
				const { params } = setup();

				await expect(filesStorageUC.getFileRecordsOfParent(params)).rejects.toThrowError(new Error('Bla'));
			});
		});

		describe('when user is authorised but no files exist', () => {
			const setup = () => {
				const { params } = buildFileRecordsWithParams();
				const fileRecords = [];

				filesStorageService.getFileRecordsOfParent.mockResolvedValueOnce([fileRecords, fileRecords.length]);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { params, fileRecords };
			};

			it('should return empty counted file records', async () => {
				const { params } = setup();

				const result = await filesStorageUC.getFileRecordsOfParent(params);

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
