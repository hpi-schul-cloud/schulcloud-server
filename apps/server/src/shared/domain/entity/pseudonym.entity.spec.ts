import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { Pseudonym } from '@shared/domain/index';
import { pseudonymFactory } from '@shared/testing/factory/pseudonym.factory';

describe('Pseudonym Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Pseudonym();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const entity = pseudonymFactory.build();
			expect(entity instanceof Pseudonym).toEqual(true);
		});
	});
});
