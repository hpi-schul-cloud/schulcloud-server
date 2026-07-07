import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { FileRecordParentType } from '../interfaces';
import { FilesStorageClientMapper } from '../mapper';
import { copyFilesRequestInfoFactory } from '../testing';
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
			const param = copyFilesRequestInfoFactory.build();

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapCopyFileListResponseToCopyFilesDto')
				.mockImplementation(() => []);

			await service.copyFilesOfParent(param);

			expect(client.copyFilesOfParent).toHaveBeenCalledWith(param);

			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const param = copyFilesRequestInfoFactory.build();

			client.copyFilesOfParent.mockRejectedValue(new Error());

			await expect(service.copyFilesOfParent(param)).rejects.toThrow();
		});
	});

	describe('listFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const taskId = new ObjectId().toHexString();

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
				.mockImplementation(() => []);

			await service.listFilesOfParent(taskId);

			expect(client.listFilesOfParent).toHaveBeenCalledWith(taskId);
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const taskId = new ObjectId().toHexString();

			client.listFilesOfParent.mockRejectedValue(new Error());

			await expect(service.listFilesOfParent(taskId)).rejects.toThrow();
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
});
