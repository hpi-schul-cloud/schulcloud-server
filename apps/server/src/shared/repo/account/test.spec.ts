import { Entity, Property, Unique } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';

@Entity()
class User extends BaseEntityWithTimestamps {
	@Unique({ options: { collation: { locale: 'en', strength: 2 } } })
	@Property()
	email: string;

	constructor(email: string) {
		super();
		this.email = email;
	}
}

describe('index', () => {
	let module: TestingModule;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User], ensureIndexes: true })],
		}).compile();

		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(User, {});
	});

	it('ensures the emails are unique', async () => {
		const user1 = new User('john@example.com');
		const user2 = new User('bob@example.com');
		const user3 = new User('John@example.com');

		await expect(em.persistAndFlush([user1, user2, user3])).rejects.toThrow();
	});

	it('ensures to find emails case insensitive', async () => {
		const user1 = new User('John@example.com');
		const user2 = new User('bob@example.com');

		await em.persistAndFlush([user1, user2]);
		em.clear();

		let count;
		count = await em.count(User, { email: 'John@example.com' });
		expect(count).toBe(1);

		count = await em.count(User, { email: 'john@example.com' });
		expect(count).toBe(1);

		count = await em.count(User, { email: 'John@example.COM' });
		expect(count).toBe(1);
	});
});
