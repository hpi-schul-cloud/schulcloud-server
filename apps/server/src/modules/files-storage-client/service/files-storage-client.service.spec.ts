import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolFactory, setupEntities, taskFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
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
			const school = schoolFactory.buildWithId();
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
			const school = schoolFactory.buildWithId();
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
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(schoolId, task);

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
				.mockImplementation(() => []);

			await service.listFilesOfParent(param);

			expect(client.listFilesOfParent).toHaveBeenCalledWith(param);
			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(schoolId, task);

			client.listFilesOfParent.mockRejectedValue(new Error());

			await expect(service.listFilesOfParent(param)).rejects.toThrowError();
		});
	});

	describe('deleteFilesOfParent', () => {
		it('Should call all steps.', async () => {
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(schoolId, task);

			const spy = jest
				.spyOn(FilesStorageClientMapper, 'mapfileRecordListResponseToDomainFilesDto')
				.mockImplementation(() => []);

			await service.deleteFilesOfParent(param);

			expect(client.deleteFilesOfParent).toHaveBeenCalledWith(param);
			expect(spy).toBeCalled();

			spy.mockRestore();
		});

		it('Should call error mapper if throw an error.', async () => {
			const schoolId = 'school123';
			const task = taskFactory.buildWithId();

			const param = FileParamBuilder.build(schoolId, task);
			client.deleteFilesOfParent.mockRejectedValue(new Error());

			await expect(service.deleteFilesOfParent(param)).rejects.toThrowError();
		});
	});
});
