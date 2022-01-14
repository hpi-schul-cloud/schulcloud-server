import { NotFoundError, ValidationError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { RoleRepo } from './role.repo';

describe('role repo', () => {
	let module: TestingModule;
	let repo: RoleRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [RoleRepo],
		}).compile();
		repo = module.get(RoleRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
		expect(typeof repo.findByName).toEqual('function');
	});

	describe('entity', () => {
		it.skip('should fail for double creating a unique role name.', async () => {
			const nameA = `a${Date.now()}`;
			const roleA1 = em.create(Role, { name: nameA });
			await em.persistAndFlush([roleA1]);
			const roleA2 = em.create(Role, { name: nameA });

			await expect(em.persistAndFlush([roleA2])).rejects.toThrow(ValidationError);
		});

		it.skip('should fail for double creating a unique role name in same step', async () => {
			const nameA = `a${Date.now()}`;
			const roleA1 = em.create(Role, { name: nameA });
			const roleA2 = em.create(Role, { name: nameA });

			await expect(em.persistAndFlush([roleA1, roleA2])).rejects.toThrow(ValidationError);
		});

		it.todo('should fail if permission by creating is added, that not exist as enum.');
	});

	describe('findByName', () => {
		afterEach(async () => {
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const nameA = `a${Date.now()}`;
			const roleA = em.create(Role, { name: nameA });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName(nameA);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by name', async () => {
			const nameA = `a${Date.now()}`;
			const nameB = `b${Date.now()}`;
			const roleA = em.create(Role, { name: nameA });
			const roleB = em.create(Role, { name: nameB });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.findByName(nameA);
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by name doesnt exist', async () => {
			const nameA = `a${Date.now()}`;

			await expect(repo.findByName(nameA)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findById', () => {
		afterEach(async () => {
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			const result = await repo.findById(idA);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by id', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });
			const roleB = em.create(Role, { id: idB });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.findById(idA);
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			await expect(repo.findById(idB)).rejects.toThrow(NotFoundError);
		});
	});
});
