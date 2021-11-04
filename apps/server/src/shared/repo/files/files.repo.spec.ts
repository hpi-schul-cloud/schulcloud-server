/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { BaseFile, File } from '@shared/domain';
import { fileFactory } from '@shared/testing';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from './files.repo';

describe('FilesRepo', () => {
	let repo: FilesRepo;
	let fileStorageAdapter: FileStorageAdapter;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				FilesRepo,
				{
					provide: FileStorageAdapter,
					useValue: {
						deleteFile: () => {},
					},
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

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('findAllFilesForCleanup', () => {
		afterEach(async () => {
			await em.nativeDelete(File, {});
		});

		it('should return deleted files marked for cleanup', async () => {
			const file = fileFactory.build({ deletedAt: new Date() });
			await em.persistAndFlush(file);
			em.clear();

			const cleanupThreshold = new Date();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeLessThanOrEqual(cleanupThreshold.getTime());

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});
		it('should return files for cleanuo, directly when deletion date matches', async () => {
			const cleanupThreshold = new Date();
			const file = fileFactory.build({ deletedAt: cleanupThreshold });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});

		it('should not return files for cleanup, which are not deleted', async () => {
			const file = fileFactory.build({ deletedAt: undefined });
			await em.persistAndFlush(file);
			const cleanupThreshold = new Date();
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(0);
		});

		it('should not return files, which are deleted too recently', async () => {
			const cleanupThreshold = new Date();
			const file = fileFactory.build({ deletedAt: new Date(cleanupThreshold.getTime() + 10) });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeGreaterThan(cleanupThreshold.getTime());
			em.clear();

			const result = await repo.findAllFilesForCleanup(cleanupThreshold);
			expect(result.length).toEqual(0);
		});
	});

	describe('deleteFile', () => {
		it('should delete the file representation in the database', async () => {
			const file = fileFactory.build();
			await em.persistAndFlush(file);

			await repo.deleteFile(file);

			const fileAfterDeletion = await em.findOne(File, file.id);
			expect(fileAfterDeletion).toBeNull();
		});

		it('should delete the file in the storage provider', async () => {
			const fileStorageAdapterSpy = jest.spyOn(fileStorageAdapter, 'deleteFile');

			const file = fileFactory.build();
			await em.persistAndFlush(file);

			await repo.deleteFile(file);

			expect(fileStorageAdapterSpy).toBeCalledTimes(1);
			expect(fileStorageAdapterSpy).toBeCalledWith(file);
		});
	});
});
