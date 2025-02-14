import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType } from '@infra/rabbitmq';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { StorageLocation } from '@modules/files-storage/interface';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup, LessonEntity, Material, Submission, Task, User } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { taskFactory } from '@testing/factory/task.factory';
import { FileParamBuilder, FilesStorageClientMapper } from '../mapper';
import { CopyFilesOfParentParamBuilder } from '../mapper/copy-files-of-parent-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: FilesStorageClientAdapterService;
	let client: DeepMocked<FilesStorageProducer>;
	let eventBus: DeepMocked<EventBus>;
	let logger: DeepMocked<LegacyLogger>;

	beforeAll(async () => {
		const orm = await setupEntities([User, Task, Submission, LessonEntity, Material, Course, CourseGroup]);

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
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		service = module.get(FilesStorageClientAdapterService);
		client = module.get(FilesStorageProducer);
		eventBus = module.get(EventBus);
		logger = module.get(LegacyLogger);
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

			const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity, StorageLocation.SCHOOL);
			const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity, StorageLocation.SCHOOL);

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

			const source = FileParamBuilder.build(sourceEntity.getSchoolId(), sourceEntity, StorageLocation.SCHOOL);
			const target = FileParamBuilder.build(targetEntity.getSchoolId(), targetEntity, StorageLocation.SCHOOL);

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
			it('should call deleteUserData', async () => {
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

		describe('when an error occurred', () => {
			it('should log this error', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);
				eventBus.publish.mockRejectedValueOnce(new Error());

				await service.handle({ deletionRequestId, targetRefId });

				expect(logger.error).toHaveBeenCalled();
			});
		});
	});
});
