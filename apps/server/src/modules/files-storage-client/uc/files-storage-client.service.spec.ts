import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, taskFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FileApi } from '../filesStorageApi/v3';
import { ErrorMapper, FileParamBuilder, FilesStorageClientMapper } from '../mapper';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

describe('FilesStorageClientAdapterService', () => {
	let module: TestingModule;
	let service: FilesStorageClientAdapterService;
	let client: DeepMocked<FileApi>;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageClientAdapterService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: 'FileStorageClient',
					useValue: createMock<FileApi>(),
				},
			],
		}).compile();

		service = module.get(FilesStorageClientAdapterService);
		client = module.get('FileStorageClient');
	});

	afterEach(async () => {
		await module.close();
	});

	describe('copyFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const sourceTask = taskFactory.buildWithId();
			const targetTask = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, sourceTask);
			const target = FileParamBuilder.build(jwt, schoolId, targetTask);

			const spy = jest.spyOn(FilesStorageClientMapper, 'mapAxiosToCopyFilesDto').mockImplementation(() => []);

			await service.copyFilesOfParent(param, target);

			const expectedOptions = { headers: { Authorization: `Bearer ${jwt}` } };
			const expectedParams = [schoolId, sourceTask.id, 'tasks', { target }, expectedOptions];

			expect(client.filesStorageControllerCopy).toHaveBeenCalledWith(...expectedParams);

			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const sourceTask = taskFactory.buildWithId();
			const targetTask = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, sourceTask);
			const target = FileParamBuilder.build(jwt, schoolId, targetTask);

			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());
			client.filesStorageControllerCopy.mockRejectedValue(new Error());

			await expect(service.copyFilesOfParent(param, target)).rejects.toThrowError();
			expect(spy).toBeCalled();

			spy.mockRestore();
		});
	});

	describe('listFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, task);

			const spy = jest.spyOn(FilesStorageClientMapper, 'mapAxiosToFilesDto').mockImplementation(() => []);

			await service.listFilesOfParent(param);

			const expectedOptions = { headers: { Authorization: `Bearer ${jwt}` } };
			const expectedParams = [schoolId, task.id, 'tasks', undefined, undefined, expectedOptions];

			expect(client.filesStorageControllerList).toHaveBeenCalledWith(...expectedParams);
			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, task);

			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());
			client.filesStorageControllerList.mockRejectedValue(new Error());

			await expect(service.listFilesOfParent(param)).rejects.toThrowError();
			expect(spy).toBeCalled();

			spy.mockRestore();
		});
	});

	describe('deleteFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, task);

			const spy = jest.spyOn(FilesStorageClientMapper, 'mapAxiosToFilesDto').mockImplementation(() => []);

			await service.deleteFilesOfParent(param);

			const expectedOptions = { headers: { Authorization: `Bearer ${jwt}` } };
			const expectedParams = [schoolId, task.id, 'tasks', expectedOptions];

			expect(client.filesStorageControllerDelete).toHaveBeenCalledWith(...expectedParams);
			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const jwt = 'jwt';
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(jwt, schoolId, task);

			const spy = jest
				.spyOn(ErrorMapper, 'mapErrorToDomainError')
				.mockImplementation(() => new InternalServerErrorException());
			client.filesStorageControllerDelete.mockRejectedValue(new Error());

			await expect(service.deleteFilesOfParent(param)).rejects.toThrowError();
			expect(spy).toBeCalled();

			spy.mockRestore();
		});
	});
});
