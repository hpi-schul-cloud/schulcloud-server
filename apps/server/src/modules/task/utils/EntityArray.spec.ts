import { BaseEntity, EntityId } from '@shared/domain';

import { EntityArray } from './EntityArray';

class TestEntity extends BaseEntity {
	id: EntityId;

	constructor(id?: EntityId) {
		super();
		this.id = id || '123';
	}
}

describe('EntityArray', () => {
	describe('constructor', () => {
		it('should possible to create by passing an empty array', () => {
			const entityArray = new EntityArray([]);

			expect(entityArray).toBeDefined();
		});

		it('should possible to create by passing an array of entitys', () => {
			const entity1 = new TestEntity();
			const entity2 = new TestEntity();

			const entityArray = new EntityArray([entity1, entity2]);

			expect(entityArray).toBeDefined();
		});

		// it do not work because only typescript validate the input to compile time
		it.skip('should throw an error by passing an array of non entity elements', () => {
			// @ts-expect-error: Test case
			expect(new EntityArray([{}, {}])).toThrow();
		});
	});

	describe('getById', () => {
		it.todo('write more tests..');
	});

	describe('getIds', () => {
		it.todo('write more tests..');
	});

	describe('isEmpty', () => {
		it.todo('write more tests..');
	});

	describe('hasOneOrMoreEntitys', () => {
		it.todo('write more tests..');
	});
});
