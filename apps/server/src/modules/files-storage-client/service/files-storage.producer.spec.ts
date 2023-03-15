import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType, FilesStorageEvents, FilesStorageExchange } from '@shared/infra/rabbitmq';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ErrorMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

describe('FilesStorageProducer', () => {
	let module: TestingModule;
	let service: FilesStorageProducer;
	let configService: DeepMocked<ConfigService>;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let orm: MikroORM;

	const timeout = 10000;

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				FilesStorageProducer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
		await orm.close();
		await module.close();
	});

	describe('copyFilesOfParent', () => {
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

		it('should call all steps.', async () => {
			amqpConnection.request.mockResolvedValue({ message: [] });

			const res = await service.copyFilesOfParent(params);

			const expectedParams = {
				exchange: FilesStorageExchange,
				routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
				payload: params,
				timeout,
			};

			expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			expect(res).toEqual([]);
		});

		it('should call error mapper if throw an error.', async () => {
			amqpConnection.request.mockResolvedValue({ message: [] });

			await service.copyFilesOfParent(params);

			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());

			amqpConnection.request.mockResolvedValue({ error: new Error() });

			await expect(service.copyFilesOfParent(params)).rejects.toThrowError();
			expect(spy).toBeCalled();
			spy.mockRestore();
		});
	});

	describe('listFilesOfParent', () => {
		const param = {
			parentType: FileRecordParentType.Task,
			schoolId: 'school123',
			parentId: '633d5acdda646580679dc448',
		};

		it('should call all steps.', async () => {
			amqpConnection.request.mockResolvedValue({ message: [] });

			const res = await service.listFilesOfParent(param);

			const expectedParams = {
				exchange: FilesStorageExchange,
				routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
				payload: param,
				timeout,
			};

			expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			expect(res).toEqual([]);
		});

		it('should call error mapper if throw an error.', async () => {
			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());

			amqpConnection.request.mockResolvedValue({ error: new Error() });

			await expect(service.listFilesOfParent(param)).rejects.toThrowError();
			expect(spy).toBeCalled();

			spy.mockRestore();
		});
	});

	describe('deleteFilesOfParent', () => {
		const param = {
			parentType: FileRecordParentType.Task,
			schoolId: 'school123',
			parentId: '633d5acdda646580679dc448',
		};

		it('should call all steps.', async () => {
			amqpConnection.request.mockResolvedValue({ message: [] });

			const res = await service.deleteFilesOfParent(param);

			const expectedParams = {
				exchange: FilesStorageExchange,
				routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
				payload: param,
				timeout,
			};

			expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			expect(res).toEqual([]);
		});

		it('should call error mapper if throw an error.', async () => {
			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());

			amqpConnection.request.mockResolvedValue({ error: new Error() });

			await expect(service.deleteFilesOfParent(param)).rejects.toThrowError();
			expect(spy).toBeCalled();

			spy.mockRestore();
		});
	});
});
