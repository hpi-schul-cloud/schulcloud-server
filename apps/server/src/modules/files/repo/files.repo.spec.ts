/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { BaseFile, File } from '@shared/domain';
import { fileFactory } from '@shared/domain/factory';
import { FilesRepo } from './files.repo';

describe('FilesRepo', () => {
	let repo: FilesRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FilesRepo],
		}).compile();

		repo = module.get(FilesRepo);
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

	describe('getExpiredFiles', () => {
		beforeEach(async () => {
			await em.nativeDelete(File, {});
		});

		it('should return expired file', async () => {
			const expiredDate = new Date();
			const file = fileFactory.build({ deletedAt: expiredDate });
			await em.persistAndFlush(file);
			em.clear();
			const backupPeriodThreshold = new Date();

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(1);
			expect(result[0]).toEqual(file);
		});

		it('should not return files, which are not deleted', async () => {
			const file = fileFactory.build({ deletedAt: undefined });
			await em.persistAndFlush(file);
			const backupPeriodThreshold = new Date();

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(0);
		});

		it('should not return files, which are deleted too recently', async () => {
			const backupPeriodThreshold = new Date();
			const file = fileFactory.build({ deletedAt: new Date() });
			await em.persistAndFlush(file);

			const result = await repo.getExpiredFiles(backupPeriodThreshold);
			expect(result.length).toEqual(0);
		});
	});
});
