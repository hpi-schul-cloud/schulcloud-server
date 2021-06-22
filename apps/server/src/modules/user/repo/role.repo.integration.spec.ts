import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { Role } from '../entity';
import { RoleRepo } from './role.repo';

describe('role repo', () => {
	let module: TestingModule;
	let repo: RoleRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Role],
				}),
			],
			providers: [RoleRepo],
		}).compile();
		repo = module.get(RoleRepo);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByName', () => {
		afterEach(async () => {
			repo.cl1.clear();
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName('a');
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by name', async () => {
			const roleA = em.create(Role, { name: 'a' });
			const roleB = em.create(Role, { name: 'b' });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.findByName('a');
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by name not exist', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			await expect(repo.findByName('b')).rejects.toThrow(NotFoundError);
		});

		it('should cache requested roles by name', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			expect(repo.cl1.get('a')).toEqual(undefined);
			await repo.findByName('a');
			expect(repo.cl1.get('a')).toEqual(roleA);
		});

		it('should select already cached roles instant of db call', async () => {
			const roleA = em.create(Role, { name: 'a' });
			const spy = jest.spyOn(repo.cl1, 'get');

			await em.persistAndFlush([roleA]);

			expect(spy).not.toHaveBeenCalled();
			await repo.findByName('a');
			expect(spy).toHaveBeenCalled();
			spy.mockRestore();
		});
	});

	describe('findById', () => {
		afterEach(async () => {
			repo.cl1.clear();
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

		it('should throw an error if roles by id not exist', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			await expect(repo.findById(idB)).rejects.toThrow(NotFoundError);
		});

		it('should cache requested roles by id', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			expect(repo.cl1.get(idA)).toEqual(undefined);
			await repo.findById(idA);
			expect(repo.cl1.get(idA)).toEqual(roleA);
		});

		it('should select already cached roles instant of db call', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });
			const spy = jest.spyOn(repo.cl1, 'get');

			await em.persistAndFlush([roleA]);

			expect(spy).not.toHaveBeenCalled();
			await repo.findById(idA);
			expect(spy).toHaveBeenCalled();
			spy.mockRestore();
		});
	});

	describe('resolvePermissionsByName', () => {
		afterEach(async () => {
			repo.cl1.clear();
			repo.cl2.clear();
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName('a');
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by name', async () => {
			const roleA = em.create(Role, { name: 'a' });
			const roleB = em.create(Role, { name: 'b' });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.resolvePermissionsByName('a');
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by name not exist', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			await expect(repo.resolvePermissionsByName('b')).rejects.toThrow(NotFoundError);
		});

		it('should resolve permissions of existing subroles', async () => {
			const idD1 = new ObjectId().toHexString();
			const idC1 = new ObjectId().toHexString();
			const idC2 = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const idA = new ObjectId().toHexString();

			const roleD1 = em.create(Role, { name: 'd1', permissions: ['D'], id: idD1 });
			const roleC1 = em.create(Role, { name: 'c1', permissions: ['C', 'C1'], roles: [idD1], id: idC1 });
			const roleC2 = em.create(Role, { name: 'c2', permissions: ['C', 'C2'], id: idC2 });
			const roleB = em.create(Role, {
				name: 'b',
				permissions: ['B', 'C'],
				roles: [idC1, idC2],
				id: idB,
			});
			const roleA = em.create(Role, { name: 'a', permissions: ['A', 'B'], roles: [idB], id: idA });

			await em.persistAndFlush([roleA, roleB, roleC1, roleC2, roleD1]);

			const result = await repo.resolvePermissionsByName('a');
			expect(result.permissions.sort()).toEqual(['A', 'B', 'C', 'C1', 'C2', 'D'].sort());
		});

		it('should cache requested roles and subroles by name', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();

			const roleB = em.create(Role, { name: 'b', id: idB });
			const roleA = em.create(Role, { name: 'a', roles: [idB], id: idA });

			await em.persistAndFlush([roleA, roleB]);
			expect(repo.cl2.get('a')).toEqual(undefined);
			expect(repo.cl2.get('b')).toEqual(undefined);

			await repo.resolvePermissionsByName('a');

			expect(repo.cl2.get('a')).toBeInstanceOf(Role);
			expect(repo.cl2.get('b')).toBeInstanceOf(Role);
		});

		it('should select already cached roles instant of db call', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();

			const roleB = em.create(Role, { name: 'b', id: idB });
			const roleA = em.create(Role, { name: 'a', roles: [idB], id: idA });
			const spy = jest.spyOn(repo.cl1, 'get');

			await em.persistAndFlush([roleA, roleB]);

			expect(spy).not.toHaveBeenCalled();
			await repo.resolvePermissionsByName('a');
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});
	});
});
