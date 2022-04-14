import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { SystemRepo } from './system.repo';

describe('system repo', () => {
	let module: TestingModule;
	let repo: SystemRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SystemRepo],
		}).compile();
		repo = module.get(SystemRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(System);
	});

	describe('findById', () => {
		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		it('should return right keys', async () => {
			const system = systemFactory.build();
			await em.persistAndFlush([system]);
			const result = await repo.findById(system.id);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'type', 'url', 'alias', 'oauthConfig', '_id'].sort()
			);
		});

		it('should return a System that matched by id', async () => {
			const system = systemFactory.build();
			await em.persistAndFlush([system]);
			const result = await repo.findById(system.id);
			expect(result).toEqual(system);
		});

		it('should throw an error if System by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});

		// it() -> design test that does something with a Systementity, so that we know, that System has been loaded correctly

		// it() -> should throw error if it loaded incorrectly
	});
});
