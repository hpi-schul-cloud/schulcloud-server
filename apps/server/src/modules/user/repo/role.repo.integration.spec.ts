import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Role } from '../entity';
import { RoleRepo } from './role.repo';

describe('role repo', () => {
	let module: TestingModule;
	let mongodb: MongoMemoryServer;
	let repo: RoleRepo;
	let orm: MikroORM;
	let em: EntityManager;

	beforeAll(async () => {
		mongodb = new MongoMemoryServer();
		const dbUrl = await mongodb.getUri();
		module = await Test.createTestingModule({
			imports: [
				MikroOrmModule.forRoot({
					type: 'mongo',
					clientUrl: dbUrl,
					entities: [Role],
				}),
			],
			providers: [RoleRepo],
		}).compile();
		repo = module.get<RoleRepo>(RoleRepo);
		orm = module.get<MikroORM>(MikroORM);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
		await mongodb.stop();
	});

	describe('findByName', () => {
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
			await repo.findByName('a');
			expect(called).toEqual(true);
		});
	});
});
