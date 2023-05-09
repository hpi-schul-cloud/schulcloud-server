import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { FileStorageAuthorizationContext } from '../files-storage.const';
import { FilesStorageService } from '../service/files-storage.service';
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
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([FileRecord]);

		module = await Test.createTestingModule({
			providers: [
				FilesStorageUC,
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
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		filesStorageUC = module.get(FilesStorageUC);
		authorizationService = module.get(AuthorizationService);
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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should call authorisation with right parameters', async () => {
				const { userId, params } = setup();

				await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					params.parentType,
					params.parentId,
					FileStorageAuthorizationContext.read
				);
			});

			it('should call service method getFilesOfParent with right parameters', async () => {
				const { userId, params } = setup();

				await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(filesStorageService.getFileRecordsOfParent).toHaveBeenCalledWith(params);
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
				authorizationService.checkPermissionByReferences.mockRejectedValueOnce(new Error('Bla'));

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
				authorizationService.checkPermissionByReferences.mockResolvedValueOnce();

				return { userId, params, fileRecords };
			};

			it('should return empty counted file records', async () => {
				const { userId, params } = setup();

				const result = await filesStorageUC.getFileRecordsOfParent(userId, params);

				expect(result).toEqual([[], 0]);
			});
		});
	});
});
