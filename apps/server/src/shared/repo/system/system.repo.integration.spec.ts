import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { SystemRepo } from '@shared/repo';

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
				['createdAt', 'updatedAt', 'type', 'url', 'alias', 'oauthConfig', '_id', 'provisioningStrategy'].sort()
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
	});

	describe('findAll', () => {
		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		it('should return all systems', async () => {
			// Arrange
			const systems = [systemFactory.build(), systemFactory.build({ oauthConfig: undefined })];
			await em.persistAndFlush(systems);

			// Act
			const result = await repo.findAll();

			// Assert
			expect(result.length).toEqual(systems.length);
			expect(result).toEqual(systems);
		});
	});

	describe('findByFilter', () => {
		let systems: System[] = [];

		beforeEach(async () => {
			systems = [systemFactory.withOauthConfig().build(), systemFactory.build()];
			await em.persistAndFlush(systems);
		});

		afterEach(async () => {
			await em.nativeDelete(System, {});
		});

		it('should return no systems', async () => {
			// Act
			const result = await repo.findByFilter();

			// Assert
			expect(result.length).toEqual(0);
			expect(result).toEqual([]);
		});

		it('should return all systems with type iserv', async () => {
			// Act
			const result = await repo.findByFilter('iserv');

			// Assert
			expect(result.length).toEqual(systems.length);
			expect(result).toEqual(systems);
		});

		it('should return all systems with type iserv and oauthConfig', async () => {
			// Act
			const result = await repo.findByFilter('iserv', true);

			// Assert
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(systems[0].id);
		});

		it('should return all systems with oauthConfig', async () => {
			// Act
			const result = await repo.findByFilter('', true);

			// Assert
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(systems[0].id);
		});
	});
});
