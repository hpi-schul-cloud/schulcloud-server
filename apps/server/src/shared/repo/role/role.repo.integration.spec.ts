import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError, NullCacheAdapter, ValidationError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, roleFactory } from '@shared/testing';
import { RoleRepo } from './role.repo';

describe('role repo', () => {
	let module: TestingModule;
	let repo: RoleRepo;
	let em: EntityManager;

	beforeAll(async () => {
		// em.clear do not clear the resultCache, it must be disabled for this test
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ resultCache: { adapter: NullCacheAdapter } })],
			providers: [RoleRepo],
		}).compile();
		repo = module.get(RoleRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Role, {});
		em.clear();
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
		expect(typeof repo.findByName).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Role);
	});

	describe('entity', () => {
		it.skip('should fail for double creating a unique role name.', async () => {
			const roleA1 = roleFactory.build({ name: RoleName.STUDENT });
			await em.persistAndFlush([roleA1]);
			const roleA2 = roleFactory.build({ name: RoleName.STUDENT });

			await expect(em.persistAndFlush([roleA2])).rejects.toThrow(ValidationError);
		});

		it.skip('should fail for double creating a unique role name in same step', async () => {
			const roleA1 = roleFactory.build({ name: RoleName.STUDENT });
			const roleA2 = roleFactory.build({ name: RoleName.STUDENT });

			await expect(em.persistAndFlush([roleA1, roleA2])).rejects.toThrow(ValidationError);
		});

		it.todo('should fail if permission by creating is added, that not exist as enum.');
	});

	describe('findByName', () => {
		it('should return right keys', async () => {
			const roleA = roleFactory.build({ name: RoleName.STUDENT });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName(RoleName.STUDENT);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by name', async () => {
			const roleA = roleFactory.build({ name: RoleName.STUDENT });
			const roleB = roleFactory.build({ name: RoleName.TEACHER });

			await em.persistAndFlush([roleA, roleB]);

			const result = await repo.findByName(RoleName.STUDENT);
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by name doesnt exist', async () => {
			await expect(repo.findByName(RoleName.STUDENT)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByNames', () => {
		let roleA;
		let roleB;

		beforeEach(async () => {
			roleA = roleFactory.build({ name: RoleName.STUDENT });
			roleB = roleFactory.build({ name: RoleName.TEAMMEMBER });
			await em.persistAndFlush([roleA, roleB]);
		});

		afterEach(() => {
			em.clear();
		});

		it('should return multiple roles that matched by names', async () => {
			const result: Role[] = await repo.findByNames([RoleName.STUDENT, RoleName.TEAMMEMBER]);
			expect(result).toContainEqual(roleA);
			expect(result).toContainEqual(roleB);
		});
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const roleA = roleFactory.build();

			await em.persistAndFlush([roleA]);
			const result = await repo.findById(roleA.id);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by id', async () => {
			const roleA = roleFactory.build();
			const roleB = roleFactory.build();

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.findById(roleA.id);
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idB = new ObjectId().toHexString();
			const roleA = roleFactory.build();

			await em.persistAndFlush([roleA]);
			await expect(repo.findById(idB)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByIds', () => {
		it('should return roles that matched by ids', async () => {
			const roleA = roleFactory.build();
			const roleB = roleFactory.build();

			await em.persistAndFlush([roleA, roleB]);
			const result: Role[] = await repo.findByIds([roleA.id, roleB.id]);
			expect(result).toContainEqual(roleA);
			expect(result).toContainEqual(roleB);
		});
	});
});
