import { wrap } from '@mikro-orm/core';
import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@testing/database';
import { BaseEntity, BaseEntityWithTimestamps } from './base.entity';

@Entity()
class User extends BaseEntity {}

@Entity()
class TimestampedUser extends BaseEntityWithTimestamps {}

@Entity()
class UnserializedUser {
	@PrimaryKey()
	_id = new ObjectId();
}

describe.each([User, TimestampedUser])('%s serialized primary key', (EntityClass) => {
	let orm: Awaited<ReturnType<typeof setupEntities>>;

	beforeAll(async () => {
		orm = await setupEntities([EntityClass]);
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should declare the inherited serialized primary key in metadata', () => {
		const metadata = orm.getMetadata().get(EntityClass);
		expect(metadata.primaryKeys).toEqual(['_id']);
		expect(metadata.serializedPrimaryKey).toBe('id');
	});

	it('should expose only the string id in plain objects and JSON', () => {
		const user = new EntityClass();
		user._id = new ObjectId();

		const object = wrap(user).toObject();
		const json: unknown = JSON.parse(JSON.stringify(user));

		expect(object).toHaveProperty('id', user._id.toHexString());
		expect(object).not.toHaveProperty('_id');
		expect(json).toHaveProperty('id', user._id.toHexString());
		expect(json).not.toHaveProperty('_id');
	});

	describe('when _id property is set to ObjectId', () => {
		it('should serialize the ObjectId to the id property', () => {
			const user = new EntityClass();
			user._id = new ObjectId();
			expect(user.id).toEqual(user._id.toHexString());
		});
	});

	describe('when id property is set to serialized ObjectId', () => {
		it('should wrap the serialized id to the _id property', () => {
			const user = new EntityClass();
			user.id = new ObjectId().toHexString();
			expect(user._id).toBeInstanceOf(ObjectId);
			expect(user._id.toHexString()).toEqual(user.id);
		});
	});
});

describe('MongoDB primary key without SerializedPrimaryKey', () => {
	it('should retain the declared _id key rather than generate an id alias', async () => {
		const orm = await setupEntities([UnserializedUser]);
		try {
			const user = new UnserializedUser();

			expect(wrap(user).toObject()).toEqual({ _id: user._id });
			expect(JSON.parse(JSON.stringify(user))).toEqual({ _id: user._id.toHexString() });
		} finally {
			await orm.close();
		}
	});
});
