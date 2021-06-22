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
		repo = module.get<RoleRepo>(RoleRepo);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByName', () => {
		it('should return right keys', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName('a');
			expect(Object.keys(result)).toEqual(['name', 'permission', 'roles', 'id', 'createdAt', 'updatedAt'].sort());
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
			let called = false;

			// mock
			const self = repo.cl1;
			repo.cl1.get = (selector: string): Role => {
				called = true;
				return self.cache[selector];
			};

			await em.persistAndFlush([roleA]);

			await repo.findByName('a');
			expect(called).toEqual(false);
			await repo.findByName('a');
			expect(called).toEqual(true);
		});
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const idA = new ObjectId().toHexString();
			const roleA = em.create(Role, { id: idA });

			await em.persistAndFlush([roleA]);
			const result = await repo.findById(idA);
			expect(Object.keys(result)).toEqual(['name', 'permission', 'roles', 'id', 'createdAt', 'updatedAt'].sort());
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
			let called = false;

			// mock
			const self = repo.cl1;
			repo.cl1.get = (selector: string): Role => {
				called = true;
				return self.cache[selector];
			};

			await em.persistAndFlush([roleA]);

			await repo.findById(idA);
			expect(called).toEqual(false);
			await repo.findById(idA);
			expect(called).toEqual(true);
		});
	});

	describe('resolvePermissionsByName', () => {
		it('should return right keys', async () => {
			const roleA = em.create(Role, { name: 'a' });

			await em.persistAndFlush([roleA]);
			const result = await repo.findByName('a');
			expect(Object.keys(result)).toEqual(['name', 'permission', 'roles', 'id', 'createdAt', 'updatedAt'].sort());
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
			const roleD1 = em.create(Role, { name: 'c1', permission: ['D'] });
			const roleC1 = em.create(Role, { name: 'c1', permission: ['C', 'C1'], roles: [roleD1.id] });
			const roleC2 = em.create(Role, { name: 'c2', permission: ['C', 'C2'] });
			const roleB = em.create(Role, { name: 'b', permission: ['B', 'C'], roles: [roleC1.id, roleC2.id] });
			const roleA = em.create(Role, { name: 'a', permission: ['A', 'B'], roles: [roleB.id] });

			await em.persistAndFlush([roleA, roleB, roleC1, roleC2, roleD1]);

			const result = await repo.resolvePermissionsByName('a');
			expect(result.permissions).toEqual(['A', 'B', 'C', 'C1', 'C2', 'D'].sort());
		});

		it('should cache requested roles and subroles by name', async () => {
			const roleB = em.create(Role, { name: 'b' });
			const roleA = em.create(Role, { name: 'a', roles: [roleB.id] });

			await em.persistAndFlush([roleA]);
			expect(repo.cl2.get('a')).toEqual(undefined);
			expect(repo.cl2.get('b')).toEqual(undefined);
			await repo.findByName('a');
			expect(repo.cl2.get('a')).toEqual(roleA);
			expect(repo.cl2.get('b')).toEqual(roleB);
		});

		it('should select already cached roles instant of db call', async () => {
			const roleB = em.create(Role, { name: 'b' });
			const roleA = em.create(Role, { name: 'a', roles: [roleB.id] });
			const called: string[] = [];

			// mock
			const self = repo.cl1;
			repo.cl1.get = (selector: string): Role => {
				called.push(selector);
				return self.cache[selector];
			};

			await em.persistAndFlush([roleA]);

			await repo.findByName('a');
			expect(called[0]).toEqual(undefined);
			expect(called[1]).toEqual(undefined);
			await repo.findByName('a');
			expect(called[0]).toEqual('b');
			expect(called[1]).toEqual('a');
		});
	});
});
