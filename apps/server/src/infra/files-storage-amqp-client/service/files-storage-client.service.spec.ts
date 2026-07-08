import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType } from '../interfaces';
import { FilesStorageClientMapper } from '../mapper';
import { CopyFilesOfParentParamBuilder } from '../mapper/copy-files-of-parent-param.builder';
import { fileRequestInfoFactory } from '../testing';
import { FilesStorageClientAdapterService } from './files-storage-client.service';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: FilesStorageClientAdapterService;
	let client: DeepMocked<FilesStorageProducer>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageClientAdapterService,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: FilesStorageProducer,
					useValue: createMock<FilesStorageProducer>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageClientAdapterService);
		client = module.get(FilesStorageProducer);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('copyFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const userId = new ObjectId().toHexString();
			const source = fileRequestInfoFactory.build();
			const target = fileRequestInfoFactory.build();

			const param = CopyFilesOfParentParamBuilder.build(userId, source, target);

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapCopyFileListResponseToCopyFilesDto')
				.mockImplementation(() => []);

			await service.copyFilesOfParent(param);

			expect(client.copyFilesOfParent).toHaveBeenCalledWith(param);

			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const userId = new ObjectId().toHexString();
			const source = fileRequestInfoFactory.build();
			const target = fileRequestInfoFactory.build();

			const param = CopyFilesOfParentParamBuilder.build(userId, source, target);

			client.copyFilesOfParent.mockRejectedValue(new Error());

			await expect(service.copyFilesOfParent(param)).rejects.toThrow();
		});
	});

	describe('listFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const parentId = new ObjectId().toHexString();

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
				.mockImplementation(() => []);

			await service.listFilesOfParent(parentId);

			expect(client.listFilesOfParent).toHaveBeenCalledWith(parentId);
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const parentId = new ObjectId().toHexString();

			client.listFilesOfParent.mockRejectedValue(new Error());

			await expect(service.listFilesOfParent(parentId)).rejects.toThrow();
		});
	});

	describe('deleteFilesOfParent', () => {
		describe('when files are deleted successfully', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				const spy = jest
					.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
					.mockImplementation(() => []);

				return { parentId, spy };
			};

			it('Should call all steps.', async () => {
				const { parentId, spy } = setup();

				await service.deleteFilesOfParent(parentId);

				expect(client.deleteFilesOfParent).toHaveBeenCalledWith(parentId);
				expect(spy).toHaveBeenCalled();

				spy.mockRestore();
			});
		});

		describe('when error is thrown', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				client.deleteFilesOfParent.mockRejectedValue(new Error());

				return { parentId };
			};

			it('Should call error mapper if throw an error.', async () => {
				const { parentId } = setup();

				await expect(service.deleteFilesOfParent(parentId)).rejects.toThrow();
			});
		});
	});

	describe('deleteFiles', () => {
		describe('when files are deleted successfully', () => {
			const setup = () => {
				const recordId = new ObjectId().toHexString();

				const spy = jest
					.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
					.mockImplementation(() => [
						{
							id: recordId,
							name: 'file',
							parentId: 'parentId',
							parentType: FileRecordParentType.BoardNode,
						},
					]);

				return { recordId, spy };
			};

			it('Should call all steps.', async () => {
				const { recordId, spy } = setup();

				await service.deleteFiles([recordId]);

				expect(client.deleteFiles).toHaveBeenCalledWith([recordId]);
				expect(spy).toHaveBeenCalled();

				spy.mockRestore();
			});
		});

		describe('when error is thrown', () => {
			const setup = () => {
				const recordId = new ObjectId().toHexString();

				client.deleteFiles.mockRejectedValue(new Error());

				return { recordId };
			};

			it('Should call error mapper if throw an error.', async () => {
				const { recordId } = setup();

				await expect(service.deleteFiles([recordId])).rejects.toThrow();
			});
		});
	});

	describe('removeCreatorIdFromFileRecords', () => {
		describe('when creator references are removed successfully', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				const spy = jest
					.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
					.mockImplementation(() => []);

				return { creatorId, spy };
			};

			it('should call the producer and mapper', async () => {
				const { creatorId, spy } = setup();

				await service.removeCreatorIdFromFileRecords(creatorId);

				expect(client.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(creatorId);
				expect(spy).toHaveBeenCalled();

				spy.mockRestore();
			});
		});

		describe('when error is thrown', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				client.removeCreatorIdFromFileRecords.mockRejectedValue(new Error());

				return { creatorId };
			};

			it('should propagate the error', async () => {
				const { creatorId } = setup();

				await expect(service.removeCreatorIdFromFileRecords(creatorId)).rejects.toThrow();
			});
		});
	});
});
