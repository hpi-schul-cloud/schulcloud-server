/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { BaseFile, File } from '@shared/domain';
import { fileFactory } from '@shared/testing';
import { FileStorageAdapter } from '@shared/infra/filestorage/filestorage.adapter';

import { FilesRepo } from './files.repo';

describe('FilesRepo', () => {
	let repo: FilesRepo;
	let fileStorageAdapter: DeepMocked<FileStorageAdapter>;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				FilesRepo,
				{
					provide: FileStorageAdapter,
					useValue: createMock<FileStorageAdapter>(),
				},
			],
		}).compile();

		repo = module.get(FilesRepo);
		fileStorageAdapter = module.get(FileStorageAdapter);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(BaseFile, {});
	});

	afterAll(async () => {
		await module.close();
	});

	const setFileStorageAdapterMock = {
		deleteFile: () => {
			const spy = fileStorageAdapter.deleteFile.mockResolvedValue();
			return spy;
		},
	};

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(BaseFile);
		});
	});

	describe('findAllFilesForCleanup', () => {
		afterEach(async () => {
			await em.nativeDelete(File, {});
		});

		it('should return deleted files marked for cleanup', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const file = fileFactory.build({ deletedAt: new Date() });
			await em.persistAndFlush(file);
			em.clear();

			const cleanupThreshold = new Date();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeLessThanOrEqual(cleanupThreshold.getTime());

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);

			spy.mockRestore();
		});
		it('should return files for cleanuo, directly when deletion date matches', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const cleanupThreshold = new Date();
			const file = fileFactory.build({ deletedAt: cleanupThreshold });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);

			spy.mockRestore();
		});

		it('should not return files for cleanup, which are not deleted', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const file = fileFactory.build({ deletedAt: undefined });
			await em.persistAndFlush(file);
			const cleanupThreshold = new Date();
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(0);

			spy.mockRestore();
		});

		it('should not return files, which are deleted too recently', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const cleanupThreshold = new Date();
			const file = fileFactory.build({ deletedAt: new Date(cleanupThreshold.getTime() + 10) });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeGreaterThan(cleanupThreshold.getTime());
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(0);

			spy.mockRestore();
		});
	});

	describe('deleteFile', () => {
		it('should delete the file representation in the database', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const file = fileFactory.build();
			await em.persistAndFlush(file);

			await repo.deleteFile(file);

			const fileAfterDeletion = await em.findOne(File, file.id);
			expect(fileAfterDeletion).toBeNull();

			spy.mockRestore();
		});

		it('should delete the file in the storage provider', async () => {
			const spy = setFileStorageAdapterMock.deleteFile();

			const fileStorageAdapterSpy = jest.spyOn(fileStorageAdapter, 'deleteFile');

			const file = fileFactory.build();
			await em.persistAndFlush(file);

			await repo.deleteFile(file);

			expect(fileStorageAdapterSpy).toBeCalledTimes(1);
			expect(fileStorageAdapterSpy).toBeCalledWith(file);

			spy.mockRestore();
		});
	});
});
