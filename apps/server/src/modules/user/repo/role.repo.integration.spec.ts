import { NotFoundError, ValidationError } from '@mikro-orm/core';
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
			repo.cl1.clear();
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

		it('should cache requested roles by name', async () => {
			const nameA = `a${Date.now()}`;
			const roleA = em.create(Role, { name: nameA });

			await em.persistAndFlush([roleA]);
			expect(repo.cl1.get(nameA)).toEqual(undefined);
			await repo.findByName(nameA);
			expect(repo.cl1.get(nameA)).toEqual(roleA);
		});

		it('should select already cached roles instead of db call', async () => {
			const nameA = `a${Date.now()}`;
			const roleA = em.create(Role, { name: nameA });
			const spy = jest.spyOn(repo.cl1, 'get');

			await em.persistAndFlush([roleA]);

			expect(spy).not.toHaveBeenCalled();
			await repo.findByName(nameA);
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

		it('should throw an error if roles by id doesnt exist', async () => {
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

		it('should select already cached roles instead of db call', async () => {
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

	describe('resolvePermissionsFromSubRolesById', () => {
		afterEach(async () => {
			repo.cl1.clear();
			repo.cl2.clear();
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			const result = await repo.resolvePermissionsFromSubRolesById(idA);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'permissions', 'roles', 'name', '_id'].sort()
			);
		});

		it('should return one role that matched by name', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });
			const roleB = em.create(Role, { id: idB });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.resolvePermissionsFromSubRolesById(idA);
			expect(result).toEqual(roleA);
		});

		it('should throw an error if roles by name doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.resolvePermissionsFromSubRolesById(idA)).rejects.toThrow(NotFoundError);
		});

		it('should resolve permissions of existing subroles', async () => {
			const idD1 = new ObjectId().toHexString();
			const idC1 = new ObjectId().toHexString();
			const idC2 = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const idA = new ObjectId().toHexString();

			const roleD1 = em.create(Role, { permissions: ['D'], id: idD1 });
			const roleC1 = em.create(Role, { permissions: ['C', 'C1'], roles: [idD1], id: idC1 });
			const roleC2 = em.create(Role, { permissions: ['C', 'C2'], id: idC2 });
			const roleB = em.create(Role, { permissions: ['B', 'C'], roles: [idC1, idC2], id: idB });
			const roleA = em.create(Role, { permissions: ['A', 'B'], roles: [idB], id: idA });

			await em.persistAndFlush([roleA, roleB, roleC1, roleC2, roleD1]);

			const result = await repo.resolvePermissionsFromSubRolesById(idA);
			expect(result.permissions.sort()).toEqual(['A', 'B', 'C', 'C1', 'C2', 'D'].sort());
		});

		it('should cache requested roles and subroles by name', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();

			const roleB = em.create(Role, { id: idB });
			const roleA = em.create(Role, { roles: [idB], id: idA });

			await em.persistAndFlush([roleA, roleB]);
			expect(repo.cl2.get(idA)).toEqual(undefined);
			expect(repo.cl2.get(idB)).toEqual(undefined);

			await repo.resolvePermissionsFromSubRolesById(idA);

			expect(repo.cl2.get(idA)).toBeInstanceOf(Role);
			expect(repo.cl2.get(idB)).toBeInstanceOf(Role);
		});

		it('should select already cached roles instead of db call', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();

			const roleB = em.create(Role, { id: idB });
			const roleA = em.create(Role, { roles: [idB], id: idA });
			const spy = jest.spyOn(repo.cl1, 'get');

			await em.persistAndFlush([roleA, roleB]);

			expect(spy).not.toHaveBeenCalled();
			await repo.resolvePermissionsFromSubRolesById(idA);
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});
	});
	/* remove later
	describe('resolvePermissionsFromSubRolesByIdsList', () => {
		afterEach(async () => {
			await em.nativeDelete(Role, {});
		});

		it('should return right keys', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });
			const idB = new ObjectId().toHexString();
			const roleB = em.create(Role, { id: idB });

			await em.persistAndFlush([roleA, roleB]);
			const result = await repo.resolvePermissionsFromSubRolesByIdList([idA, idB]);
			expect(Object.keys(result).sort()).toEqual(['permissions', 'roles'].sort());
		});

		it('should return unqiue roles and resolved permissions', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const idC = new ObjectId().toHexString();
			const roleC = em.create(Role, { id: idC, permissions: ['C'] });
			const roleB = em.create(Role, { roles: [idC], id: idB, permissions: ['A', 'D'] });
			const roleA = em.create(Role, { roles: [idB], id: idA, permissions: ['B', 'D'] });

			await em.persistAndFlush([roleA, roleB, roleC]);
			const result = await repo.resolvePermissionsFromSubRolesByIdList([idA, idB]);
			expect(result.permissions.sort()).toEqual(['A', 'B', 'C', 'D'].sort());
			expect(result.roles.length).toEqual(2);
		});
	}); */
});
