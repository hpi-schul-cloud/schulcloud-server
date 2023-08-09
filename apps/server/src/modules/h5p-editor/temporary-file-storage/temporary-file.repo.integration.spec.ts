import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, h5pTemporaryFileFactory } from '@shared/testing';
import { TemporaryFile } from './temporary-file.entity';
import { TemporaryFileRepo } from './temporary-file.repo';

describe('TemporaryFileRepo', () => {
	let module: TestingModule;
	let repo: TemporaryFileRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [TemporaryFile] })],
			providers: [TemporaryFileRepo],
		}).compile();

		repo = module.get(TemporaryFileRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(TemporaryFile);
	});

	describe('createTemporaryFile', () => {
		it('should be able to retrieve entity', async () => {
			const tempFile = h5pTemporaryFileFactory.build();
			await em.persistAndFlush(tempFile);

			const result = await repo.findById(tempFile.id);

			expect(result).toBeDefined();
			expect(result).toEqual(tempFile);
		});
	});

	describe('findByUserAndFilename', () => {
		it('should be able to retrieve entity', async () => {
			const tempFile = h5pTemporaryFileFactory.build();
			await em.persistAndFlush(tempFile);

			const result = await repo.findByUserAndFilename(tempFile.ownedByUserId, tempFile.filename);

			expect(result).toBeDefined();
			expect(result).toEqual(tempFile);
		});

		it('should fail if entity does not exist', async () => {
			const user = 'wrong-user-id';
			const filename = 'file.txt';

			const findBy = repo.findByUserAndFilename(user, filename);

			await expect(findBy).rejects.toThrow();
		});
	});

	describe('findExpired', () => {
		it('should return expired files', async () => {
			const [expiredFile, validFile] = [h5pTemporaryFileFactory.isExpired().build(), h5pTemporaryFileFactory.build()];
			await em.persistAndFlush([expiredFile, validFile]);

			const result = await repo.findExpired();

			expect(result.length).toBe(1);
			expect(result[0]).toEqual(expiredFile);
		});
	});

	describe('findByUser', () => {
		it('should return files for user', async () => {
			const [firstFile, secondFile] = [h5pTemporaryFileFactory.build(), h5pTemporaryFileFactory.build()];
			await em.persistAndFlush([firstFile, secondFile]);

			const result = await repo.findByUser(firstFile.ownedByUserId);

			expect(result.length).toBe(1);
			expect(result[0]).toEqual(firstFile);
		});
	});

	describe('findExpiredByUser', () => {
		it('should return expired files for user', async () => {
			const [firstFile, secondFile] = [
				h5pTemporaryFileFactory.isExpired().build(),
				h5pTemporaryFileFactory.isExpired().build(),
			];
			await em.persistAndFlush([firstFile, secondFile]);

			const result = await repo.findExpiredByUser(firstFile.ownedByUserId);

			expect(result.length).toBe(1);
			expect(result[0]).toEqual(firstFile);
		});
	});
});
