import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType, FilesStorageEvents, FilesStorageExchange } from '@shared/infra/rabbitmq';
import { setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ErrorMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageProducer', () => {
	let module: TestingModule;
	let service: FilesStorageProducer;
	let configService: DeepMocked<ConfigService>;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const timeout = 10000;

	beforeAll(async () => {
		await setupEntities();
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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageProducer);
		amqpConnection = module.get(AmqpConnection);
		configService = module.get(ConfigService);
		configService.get.mockReturnValue(timeout);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyFilesOfParent', () => {
		describe('when amqpConnection return with error in response', () => {
			const setup = () => {
				const params = {
					userId: new ObjectId().toHexString(),
					source: {
						parentType: FileRecordParentType.Task,
						schoolId: '633d59e1c7a36834ad61e525',
						parentId: '633d59e1c7a36834ad61e526',
					},
					target: {
						parentType: FileRecordParentType.Task,
						schoolId: '633d59e1c7a36834ad61e525',
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
						schoolId,
						parentId: parentIdSource,
					},
					target: {
						parentType: FileRecordParentType.Task,
						schoolId,
						parentId: parentIdTarget,
					},
				};

				const message = [];
				amqpConnection.request.mockResolvedValueOnce({ message });

				const expectedParams = {
					exchange: FilesStorageExchange,
					routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
					payload: params,
					timeout,
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
				const schoolId = new ObjectId().toHexString();
				const parentId = new ObjectId().toHexString();

				const param = {
					parentType: FileRecordParentType.Task,
					schoolId,
					parentId,
				};

				amqpConnection.request.mockResolvedValue({ error: new Error() });

				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { param, spy };
			};

			it('should call error mapper and throw with error', async () => {
				const { param, spy } = setup();

				await expect(service.listFilesOfParent(param)).rejects.toThrowError();
				expect(spy).toBeCalled();
			});
		});

		describe('when valid params are passed and ampq do return with message', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const parentId = new ObjectId().toHexString();

				const param = {
					parentType: FileRecordParentType.Task,
					schoolId,
					parentId,
				};

				const expectedParams = {
					exchange: FilesStorageExchange,
					routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
					payload: param,
					timeout,
				};

				const message = [];

				amqpConnection.request.mockResolvedValue({ message });

				return { param, expectedParams, message };
			};

			it('should call the ampqConnection.', async () => {
				const { param, expectedParams } = setup();

				await service.listFilesOfParent(param);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { param, message } = setup();

				const res = await service.listFilesOfParent(param);

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
					exchange: FilesStorageExchange,
					routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
					payload: parentId,
					timeout,
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
});
