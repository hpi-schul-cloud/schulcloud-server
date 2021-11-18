import { Entity, Property } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';
import { Scope } from './scope';

export interface ITestEntityProperties {
	name: string;
	numbers?: number[];
}

@Entity()
class TestEntity {
	@Property()
	name: string;

	@Property()
	numbers: number[];

	constructor(props: ITestEntityProperties) {
		this.name = props.name;
		this.numbers = props.numbers || [];
	}
}

describe('scope.ts', () => {
	describe('class Scope', () => {
		it('should be able to create an instance of Scope.', () => {
			const scope = new Scope();
			expect(scope).toBeInstanceOf(Scope);
		});

		it('should be able to create an instance of Scope with passed entity type.', () => {
			const scope = new Scope<TestEntity>();
			expect(scope).toBeInstanceOf(Scope);
		});

		it('should be able to add a single query and get it', () => {
			const scope = new Scope<TestEntity>();
			const query = { name: 'abc' };
			scope.addQuery(query);
			expect(scope.query).toEqual(query);
		});

		it('should be able to add multiple queries and get them as concatination of $and by default.', () => {
			const scope = new Scope<TestEntity>();

			const query1 = { name: 'abc' };
			scope.addQuery(query1);
			const query2 = { numbers: 123 };
			scope.addQuery(query2);

			expect(scope.query).toEqual({ $and: [query1, query2] });
		});

		it('should be able to use the $or operator', () => {
			const scope = new Scope<TestEntity>('$or');

			const query1 = { name: 'abc' };
			scope.addQuery(query1);
			const query2 = { numbers: 123 };
			scope.addQuery(query2);

			expect(scope.query).toEqual({ $or: [query1, query2] });
		});

		it('should return a query for an empty result if nothing was added', () => {
			const scope1 = new Scope<TestEntity>('$and');
			const scope2 = new Scope<TestEntity>('$or');
			expect(scope1.query).toEqual(EmptyResultQuery);
			expect(scope2.query).toEqual(EmptyResultQuery);
		});
	});
});
