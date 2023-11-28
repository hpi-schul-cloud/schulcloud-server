import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecord, FileRecordParentType } from '../entity';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { FileRecordResponse } from './dto';
import { FilesStorageConsumer } from './files-storage.consumer';

describe('FilesStorageConsumer', () => {
	let module: TestingModule;
	let filesStorageService: DeepMocked<FilesStorageService>;
	let service: FilesStorageConsumer;
	let orm: MikroORM;

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);
		module = await Test.createTestingModule({
			providers: [
				FilesStorageConsumer,
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
				{
					provide: PreviewService,
					useValue: createMock<PreviewService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		filesStorageService = module.get(FilesStorageService);
		service = module.get(FilesStorageConsumer);
	});

	const createFileParams = () => {
		const params = {
			parentId: new ObjectId().toHexString(),
			parentType: FileRecordParentType.Course,
			schoolId: new ObjectId().toHexString(),
		};

		return params;
	};

	describe('copyFilesOfParent()', () => {
		describe('WHEN valid file exists', () => {
			it('should call filesStorageService.copyFilesOfParent with params', async () => {
				const payload = {
					userId: new ObjectId().toHexString(),
					source: createFileParams(),
					target: createFileParams(),
				};
				await service.copyFilesOfParent(payload);
				expect(filesStorageService.copyFilesOfParent).toBeCalledWith(payload.userId, payload.source, {
					target: payload.target,
				});
			});

			it('regular RPC handler should receive a valid RPC response', async () => {
				const payload = {
					userId: new ObjectId().toHexString(),
					source: createFileParams(),
					target: createFileParams(),
				};
				const responseData = [{ id: '1', sourceId: '2', name: 'test.txt' }];
				filesStorageService.copyFilesOfParent.mockResolvedValue([responseData, responseData.length]);
				const response = await service.copyFilesOfParent(payload);
				expect(response.message).toEqual(responseData);
			});
		});

		describe('WHEN file not exists', () => {
			it('should return RpcMessage with empty array', async () => {
				const payload = {
					userId: new ObjectId().toHexString(),
					source: createFileParams(),
					target: createFileParams(),
				};
				filesStorageService.copyFilesOfParent.mockResolvedValue([[], 0]);
				const response = await service.copyFilesOfParent(payload);
				expect(response.message).toEqual([]);
			});
		});
	});

	describe('fileRecordsOfParent()', () => {
		describe('WHEN valid file exists', () => {
			it('should call filesStorageService.fileRecordsOfParent with params', async () => {
				const payload = createFileParams();
				filesStorageService.getFileRecordsOfParent.mockResolvedValue([[], 0]);
				await service.getFilesOfParent(payload);
				expect(filesStorageService.getFileRecordsOfParent).toBeCalledWith(payload.parentId);
			});

			it('should return array instances of FileRecordResponse', async () => {
				const payload = createFileParams();

				const fileRecords = fileRecordFactory.buildList(3, payload);

				filesStorageService.getFileRecordsOfParent.mockResolvedValue([fileRecords, fileRecords.length]);
				const response = await service.getFilesOfParent(payload);
				expect(response.message[0]).toBeInstanceOf(FileRecordResponse);
			});
		});

		describe('WHEN file not exists', () => {
			it('should return RpcMessage with empty array', async () => {
				const payload = createFileParams();
				filesStorageService.getFileRecordsOfParent.mockResolvedValue([[], 0]);
				const response = await service.getFilesOfParent(payload);
				expect(response).toStrictEqual({ message: [] });
			});
		});
	});

	describe('deleteFilesOfParent()', () => {
		describe('WHEN valid file exists', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				const fileRecords = fileRecordFactory.buildList(3);
				filesStorageService.getFileRecordsOfParent.mockResolvedValue([fileRecords, fileRecords.length]);

				return { parentId, fileRecords };
			};

			it('should call filesStorageService.deleteFilesOfParent with params', async () => {
				const { parentId } = setup();

				await service.deleteFilesOfParent(parentId);

				expect(filesStorageService.getFileRecordsOfParent).toBeCalledWith(parentId);
			});

			it('should call filesStorageService.deleteFilesOfParent with params', async () => {
				const { parentId, fileRecords } = setup();

				await service.deleteFilesOfParent(parentId);

				expect(filesStorageService.deleteFilesOfParent).toBeCalledWith(fileRecords);
			});

			it('should return array instances of FileRecordResponse', async () => {
				const { parentId } = setup();

				const response = await service.deleteFilesOfParent(parentId);

				expect(response.message[0]).toBeInstanceOf(FileRecordResponse);
			});
		});

		describe('WHEN no file exists', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				filesStorageService.getFileRecordsOfParent.mockResolvedValue([[], 0]);

				return { parentId };
			};

			it('should return RpcMessage with empty array', async () => {
				const { parentId } = setup();

				const response = await service.deleteFilesOfParent(parentId);

				expect(response).toStrictEqual({ message: [] });
			});
		});
	});
});
