import { LegacyLogger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { ErrorMapper } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageClientConfig } from '../files-storage-client-config';
import { FileRecordParentType, FilesStorageEvents } from '../interfaces';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageProducer', () => {
	let module: TestingModule;
	let service: FilesStorageProducer;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let config: FilesStorageClientConfig;
	const timeout = 10000;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageProducer,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: FilesStorageClientConfig,
					useValue: {
						exchangeName: 'files-storage-exchange',
						incomingTimeoutCopyApi: timeout,
					},
				},
			],
		}).compile();

		amqpConnection = module.get(AmqpConnection);
		config = module.get(FilesStorageClientConfig);
		service = new FilesStorageProducer(amqpConnection, module.get(LegacyLogger), config);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('copyFilesOfParent', () => {
		describe('when amqpConnection return with error in response', () => {
			const setup = () => {
				const params = {
					userId: new ObjectId().toHexString(),
					source: {
						parentType: FileRecordParentType.Task,
						storageLocationId: '633d59e1c7a36834ad61e525',
						storageLocation: StorageLocation.SCHOOL,
						parentId: '633d59e1c7a36834ad61e526',
					},
					target: {
						parentType: FileRecordParentType.Task,
						storageLocationId: '633d59e1c7a36834ad61e525',
						storageLocation: StorageLocation.SCHOOL,
						parentId: '633d59e1c7a36834ad61e527',
					},
				};

				amqpConnection.request.mockResolvedValueOnce({ error: new Error() });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { params, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { params, spy } = setup();

				await expect(service.copyFilesOfParent(params)).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid params are passed and amqp connection return with a message', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const parentIdSource = new ObjectId().toHexString();
				const parentIdTarget = new ObjectId().toHexString();

				const params = {
					userId,
					source: {
						parentType: FileRecordParentType.Task,
						storageLocationId: schoolId,
						storageLocation: StorageLocation.SCHOOL,
						parentId: parentIdSource,
					},
					target: {
						parentType: FileRecordParentType.Task,
						storageLocationId: schoolId,
						storageLocation: StorageLocation.SCHOOL,
						parentId: parentIdTarget,
					},
				};

				const message = [];
				amqpConnection.request.mockResolvedValueOnce({ message });

				const expectedParams = {
					exchange: config.exchangeName,
					routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
					payload: params,
					timeout,
					expiration: timeout * 1.5,
				};

				return { params, expectedParams, message };
			};

			it('should call the ampqConnection.', async () => {
				const { params, expectedParams } = setup();

				await service.copyFilesOfParent(params);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { params, message } = setup();

				const res = await service.copyFilesOfParent(params);

				expect(res).toEqual(message);
			});
		});
	});

	describe('listFilesOfParent', () => {
		describe('when valid parameter passed and amqpConnection return with error in response', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				amqpConnection.request.mockResolvedValue({ error: new Error() });

				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { parentId, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { parentId, spy } = setup();

				await expect(service.listFilesOfParent(parentId)).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid params are passed and ampq do return with message', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				const expectedParams = {
					exchange: config.exchangeName,
					routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
					payload: parentId,
					timeout,
					expiration: timeout * 1.5,
				};

				const message = [];

				amqpConnection.request.mockResolvedValue({ message });

				return { parentId, expectedParams, message };
			};

			it('should call the ampqConnection.', async () => {
				const { parentId, expectedParams } = setup();

				await service.listFilesOfParent(parentId);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { parentId, message } = setup();

				const res = await service.listFilesOfParent(parentId);

				expect(res).toEqual(message);
			});
		});
	});

	describe('deleteFilesOfParent', () => {
		describe('when valid parameter passed and amqpConnection return with error in response', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				amqpConnection.request.mockResolvedValue({ error: new Error() });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { parentId, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { parentId, spy } = setup();

				await expect(service.deleteFilesOfParent(parentId)).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid parameter passed and amqpConnection return with message', () => {
			const setup = () => {
				const parentId = new ObjectId().toHexString();

				const message = [];
				amqpConnection.request.mockResolvedValue({ message });

				const expectedParams = {
					exchange: config.exchangeName,
					routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
					payload: parentId,
					timeout,
					expiration: timeout * 1.5,
				};

				return { parentId, message, expectedParams };
			};

			it('should call the ampqConnection.', async () => {
				const { parentId, expectedParams } = setup();

				await service.deleteFilesOfParent(parentId);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { parentId, message } = setup();

				const res = await service.deleteFilesOfParent(parentId);

				expect(res).toEqual(message);
			});
		});
	});

	describe('deleteFiles', () => {
		describe('when valid parameter passed and amqpConnection return with error in response', () => {
			const setup = () => {
				const recordId = new ObjectId().toHexString();

				amqpConnection.request.mockResolvedValue({ error: new Error() });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { recordId, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { recordId, spy } = setup();

				await expect(service.deleteFiles([recordId])).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid parameter passed and amqpConnection return with message', () => {
			const setup = () => {
				const recordId = new ObjectId().toHexString();

				const message = [];
				amqpConnection.request.mockResolvedValue({ message });

				const expectedParams = {
					exchange: config.exchangeName,
					routingKey: FilesStorageEvents.DELETE_FILES,
					payload: [recordId],
					timeout,
					expiration: timeout * 1.5,
				};
				return { recordId, message, expectedParams };
			};

			it('should call the ampqConnection.', async () => {
				const { recordId, expectedParams } = setup();

				await service.deleteFiles([recordId]);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { recordId, message } = setup();

				const res = await service.deleteFiles([recordId]);

				expect(res).toEqual(message);
			});
		});
	});

	describe('removeCreatorIdFromFileRecords', () => {
		describe('when valid parameter passed and amqpConnection return with error in response', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				amqpConnection.request.mockResolvedValue({ error: new Error() });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { creatorId, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { creatorId, spy } = setup();

				await expect(service.removeCreatorIdFromFileRecords(creatorId)).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid parameter passed and amqpConnection return with message', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				const message = [];
				amqpConnection.request.mockResolvedValue({ message });

				const expectedParams = {
					exchange: config.exchangeName,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					routingKey: FilesStorageEvents.REMOVE_CREATORID_OF_FILES,
					payload: creatorId,
					timeout,
					expiration: timeout * 1.5,
				};

				return { creatorId, message, expectedParams };
			};

			it('should call the ampqConnection.', async () => {
				const { creatorId, expectedParams } = setup();

				await service.removeCreatorIdFromFileRecords(creatorId);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { creatorId, message } = setup();

				const res = await service.removeCreatorIdFromFileRecords(creatorId);

				expect(res).toEqual(message);
			});
		});
	});
});
