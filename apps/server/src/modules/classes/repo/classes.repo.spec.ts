import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { TestingModule } from '@nestjs/testing/testing-module';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { classEntityFactory } from '@shared/testing/factory/class.factory';
import { ClassesRepo } from './classes.repo';
import { ClassEntity } from '../entity';

describe('ClassesRepo', () => {
	let module: TestingModule;
	let repo: ClassesRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ClassesRepo],
		}).compile();

		repo = module.get(ClassesRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findAllByUserId', () => {
		describe('when user is not found in classes', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllByUserId(new ObjectId().toHexString());

				expect(result).toEqual([]);
			});
		});
		describe('when user is in classes', () => {
			const setup = async () => {
				const testUser = new ObjectId();
				const class1: ClassEntity = classEntityFactory.withUserIds([testUser, new ObjectId()]).buildWithId();
				const class2: ClassEntity = classEntityFactory.withUserIds([testUser, new ObjectId()]).buildWithId();
				const class3: ClassEntity = classEntityFactory.withUserIds([new ObjectId(), new ObjectId()]).buildWithId();
				await em.persistAndFlush([class1, class2, class3]);

				return {
					class1,
					class2,
					class3,
				};
			};

			it('should find classes with particular userId', async () => {
				const { class1, class2 } = await setup();

				const a = class1.userIds?.at(0) as ObjectId;
				const result = await repo.findAllByUserId(a.toHexString());

				expect(result.length).toEqual(2);

				expect(result[0].id).toEqual(class1.id);
				expect(result[1].id).toEqual(class2.id);
			});
		});
	});

	describe('updateMany', () => {
		const setup = async () => {
			const testUser1 = new ObjectId();
			const testUser2 = new ObjectId();
			const testUser3 = new ObjectId();
			const class1: ClassEntity = classEntityFactory.withUserIds([testUser1, testUser2]).buildWithId();
			const class2: ClassEntity = classEntityFactory.withUserIds([testUser1, testUser3]).buildWithId();
			const class3: ClassEntity = classEntityFactory.withUserIds([testUser2, testUser3]).buildWithId();
			await em.persistAndFlush([class1, class2, class3]);

			return {
				class1,
				class2,
				testUser1,
				testUser2,
				testUser3,
			};
		};

		it('should update classes without deleted user', async () => {
			const { class1, class2, testUser1, testUser2, testUser3 } = await setup();

			class1.userIds = [testUser2];
			class2.userIds = [testUser3];

			const updatedArray: ClassEntity[] = [class1, class2];

			await repo.updateMany(updatedArray);

			const result1 = await repo.findAllByUserId(testUser1.toHexString());
			expect(result1).toHaveLength(0);

			const result2 = await repo.findAllByUserId(testUser2.toHexString());
			expect(result2).toHaveLength(2);

			const result3 = await repo.findAllByUserId(testUser3.toHexString());
			expect(result3).toHaveLength(2);
		});
	});
});
