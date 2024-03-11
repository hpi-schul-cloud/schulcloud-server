import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolEntityFactory, setupEntities, taskFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { FileRecordParentType } from '@infra/rabbitmq';
import { EventBus } from '@nestjs/cqrs';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { DomainName, OperationType } from '@shared/domain/types';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { DataDeletedEvent } from '@modules/deletion';
import { FileParamBuilder, FilesStorageClientMapper } from '../mapper';
import { CopyFilesOfParentParamBuilder } from '../mapper/copy-files-of-parent-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: FilesStorageClientAdapterService;
	let client: DeepMocked<FilesStorageProducer>;
	let eventBus: DeepMocked<EventBus>;

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
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get(FilesStorageClientAdapterService);
		client = module.get(FilesStorageProducer);
		eventBus = module.get(EventBus);
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

				await service.deleteUserData(creatorId);

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

				await expect(service.deleteUserData(creatorId)).rejects.toThrowError();
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
