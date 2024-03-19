import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolEntityFactory, setupEntities, taskFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParentType } from '@infra/rabbitmq';
import { FileParamBuilder, FilesStorageClientMapper } from '../mapper';
import { CopyFilesOfParentParamBuilder } from '../mapper/copy-files-of-parent-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: FilesStorageClientAdapterService;
	let client: DeepMocked<FilesStorageProducer>;

	beforeAll(async () => {
		await setupEntities();

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
			const school = schoolEntityFactory.buildWithId();
			const sourceEntity = taskFactory.buildWithId({ school });
			const targetEntity = taskFactory.buildWithId({ school });

			const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity);
			const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity);

			const param = CopyFilesOfParentParamBuilder.build(userId, source, target);

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapCopyFileListResponseToCopyFilesDto')
				.mockImplementation(() => []);

			await service.copyFilesOfParent(param);

			expect(client.copyFilesOfParent).toHaveBeenCalledWith(param);

			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const userId = new ObjectId().toHexString();
			const school = schoolEntityFactory.buildWithId();
			const sourceEntity = taskFactory.buildWithId({ school });
			const targetEntity = taskFactory.buildWithId({ school });

			const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity);
			const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity);

			const param = CopyFilesOfParentParamBuilder.build(userId, source, target);

			client.copyFilesOfParent.mockRejectedValue(new Error());

			await expect(service.copyFilesOfParent(param)).rejects.toThrowError();
		});
	});

	describe('listFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const task = taskFactory.buildWithId();

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
				.mockImplementation(() => []);

			await service.listFilesOfParent(task.id);

			expect(client.listFilesOfParent).toHaveBeenCalledWith(task.id);
			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const task = taskFactory.buildWithId();

			client.listFilesOfParent.mockRejectedValue(new Error());

			await expect(service.listFilesOfParent(task.id)).rejects.toThrowError();
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
				expect(spy).toBeCalled();

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

				await expect(service.deleteFilesOfParent(parentId)).rejects.toThrowError();
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
				expect(spy).toBeCalled();

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

				await expect(service.deleteFiles([recordId])).rejects.toThrowError();
			});
		});
	});

	describe('removeCreatorIdFromFileRecords', () => {
		describe('when creatorId is deleted successfully', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				return { creatorId };
			};

			it('Should call client.removeCreatorIdFromFileRecords', async () => {
				const { creatorId } = setup();

				await service.removeCreatorIdFromFileRecords(creatorId);

				expect(client.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(creatorId);
			});
		});

		describe('when error is thrown', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				client.removeCreatorIdFromFileRecords.mockRejectedValue(new Error());

				return { creatorId };
			};

			it('Should call error mapper if throw an error.', async () => {
				const { creatorId } = setup();

				await expect(service.removeCreatorIdFromFileRecords(creatorId)).rejects.toThrowError();
			});
		});
	});
});
