/* eslint-disable @typescript-eslint/no-unused-expressions */
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { File } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { userFileFactory } from '@shared/testing';

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
		await em.nativeDelete(File, {});
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

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(File);
		});
	});

	describe('findAllFilesForCleanup', () => {
		it('should return files marked for deletion', async () => {
			const file = userFileFactory.build({ deletedAt: new Date() });
			await em.persistAndFlush(file);
			em.clear();

			const thresholdDate = new Date();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);

			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(file.id);
		});

		it('should not return files which are not marked for deletion', async () => {
			const file = userFileFactory.build({ deletedAt: undefined });
			await em.persistAndFlush(file);
			const thresholdDate = new Date();
			em.clear();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);
			expect(result.length).toEqual(0);
		});

		it('should not return files where deletedAt is after threshold', async () => {
			const thresholdDate = new Date();
			const file = userFileFactory.build({ deletedAt: new Date(thresholdDate.getTime() + 10) });
			await em.persistAndFlush(file);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(file.deletedAt!.getTime()).toBeGreaterThan(thresholdDate.getTime());
			em.clear();

			const result = await repo.findFilesForCleanup(thresholdDate, 3, 0);
			expect(result.length).toEqual(0);
		});
	});
});
