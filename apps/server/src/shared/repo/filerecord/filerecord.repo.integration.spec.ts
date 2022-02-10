import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, courseFactory, courseFileRecordFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { FileRecordRepo } from './filerecord.repo';

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [FileRecordRepo],
		}).compile();
		repo = module.get(FileRecordRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findOneById', () => {
		it('should find an entity by its id', async () => {
			const fileRecord = courseFileRecordFactory.build();
			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});
	});

	describe('findByTargetId', () => {
		it('should find an entity by its id', async () => {
			const course = courseFactory.build();
			const fileRecords = courseFileRecordFactory.buildList(3, { target: course });
			await em.persistAndFlush(fileRecords);
			em.clear();

			const [results, count] = await repo.findByTargetId(course.id);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
		});
	});
});
