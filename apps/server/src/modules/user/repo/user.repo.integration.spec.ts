import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { UserRepo } from './user.repo';

describe('user repo', () => {
	let module: TestingModule;
	let repo: UserRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UserRepo],
		}).compile();
		repo = module.get(UserRepo);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	describe('findById', () => {
		afterEach(async () => {
			await em.nativeDelete(User, {});
		});

		it('should return right keys', async () => {
			const idA = new ObjectId().toHexString();
			const userA = em.create(User, { id: idA });

			await em.persistAndFlush([userA]);
			const result = await repo.findById(idA);
			expect(Object.keys(result).sort()).toEqual(
				['createdAt', 'updatedAt', 'roles', 'firstName', 'lastName', 'email', 'school', '_id'].sort()
			);
		});

		it('should return one role that matched by id', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			const userA = em.create(User, { id: idA });
			const userB = em.create(User, { id: idB });

			await em.persistAndFlush([userA, userB]);
			const result = await repo.findById(idA);
			expect(result).toEqual(userA);
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});
	});
});
