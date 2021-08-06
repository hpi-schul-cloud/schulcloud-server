import { Entity, Property } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';
import { Scope, isDefinedQuery, isDefined, forceArray, createOrQueryFromList, useQueryIfValueIsDefined } from './scope';

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
		it('should possible to create an instance of Scope.', () => {
			const scope = new Scope();
			expect(scope).toBeInstanceOf(Scope);
		});

		it('should possible to create an instance of Scope with passed entity type.', () => {
			const scope = new Scope<TestEntity>();
			expect(scope).toBeInstanceOf(Scope);
		});

		it('should possible add single query and get it', () => {
			const scope = new Scope<TestEntity>();
			const query = { name: 'abc' };
			scope.addQuery(query);
			expect(scope.query).toEqual(query);
		});

		it('should possible add multiple query and get it as concatination of $and.', () => {
			const scope = new Scope<TestEntity>();
			const query1 = { name: 'abc' };
			scope.addQuery(query1);
			const query2 = { numbers: 123 };
			scope.addQuery(query2);
			expect(scope.query).toEqual({ $and: [query1, query2] });
		});

		it('should support shorthand helper useQueryIfValueIsDefined.', () => {
			const scope = new Scope<TestEntity>();
			expect(typeof scope.useQueryIfValueIsDefined).toEqual('function');
		});

		it('should support shorthand helper createOrQueryFromList.', () => {
			const scope = new Scope<TestEntity>();
			expect(typeof scope.createOrQueryFromList).toEqual('function');
		});

		it('should support shorthand helper isDefinedQuery.', () => {
			const scope = new Scope<TestEntity>();
			expect(typeof scope.isDefinedQuery).toEqual('function');
		});
	});

	describe('isDefined', () => {
		it('should return true for passing defined value.', () => {
			const result = isDefined('abc');
			expect(result).toBeTruthy();
		});

		it('should return true for passing empty object value.', () => {
			const result = isDefined({});
			expect(result).toBeTruthy();
		});

		it('should return false for passing null value.', () => {
			const result = isDefined(null);
			expect(result).toBeFalsy();
		});

		it('should return false for passing undefined value.', () => {
			const result = isDefined(undefined);
			expect(result).toBeFalsy();
		});
	});

	describe('isDefinedQuery', () => {
		it('should return true for passing defined query value.', () => {
			const result = isDefinedQuery({ name: 'abc' });
			expect(result).toBeTruthy();
		});

		it('should return false for passing null query value.', () => {
			const result = isDefinedQuery(null);
			expect(result).toBeFalsy();
		});

		it('should return false for passing undefined query value.', () => {
			const result = isDefinedQuery(undefined);
			expect(result).toBeFalsy();
		});

		it('should return false for passing empty object query value.', () => {
			const result = isDefinedQuery({});
			expect(result).toBeFalsy();
		});

		it('should return false for passing empty object query value.', () => {
			const result = isDefinedQuery('abc');
			expect(result).toBeFalsy();
		});

		it('should return false for passing empty object query value.', () => {
			const result = isDefinedQuery(123);
			expect(result).toBeFalsy();
		});

		it('should return false for passing empty object query value.', () => {
			const result = isDefinedQuery(() => {});
			expect(result).toBeFalsy();
		});
	});

	describe('forceArray', () => {
		it('should return an empty array by passing an empty array value.', () => {
			const result = forceArray([]);
			expect(result).toEqual([]);
		});

		it('should return an array wit value by passing an array with value.', () => {
			const array = ['abc', 123, {}];
			const result = forceArray(array);
			expect(result).toEqual(array);
		});

		it('should return an empty array by passing null value.', () => {
			// @ts-expect-error: Test case
			const result = forceArray(null);
			expect(result).toEqual([]);
		});

		it('should return an empty array by passing undefined value.', () => {
			// @ts-expect-error: Test case
			const result = forceArray(undefined);
			expect(result).toEqual([]);
		});

		it('should return an empty array by passing string value.', () => {
			// @ts-expect-error: Test case
			const result = forceArray('abc');
			expect(result).toEqual([]);
		});

		it('should return an empty array by passing numver value.', () => {
			// @ts-expect-error: Test case
			const result = forceArray(123);
			expect(result).toEqual([]);
		});

		it('should return an empty array by passing object value.', () => {
			// @ts-expect-error: Test case
			const result = forceArray({});
			expect(result).toEqual([]);
		});
	});

	describe('useQueryIfValueIsDefined', () => {
		it('should return passing query param if first parameter is valid defined value.', () => {
			const testedValue = 123;
			const selectedQuery = { name: 'abc' };
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(selectedQuery);
		});

		it('should return passing query param if first parameter is empty object.', () => {
			const testedValue = {};
			const selectedQuery = { name: 'abc' };
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(selectedQuery);
		});

		it('should return EmptyResultQuery if first parameter is undefined value.', () => {
			const testedValue = undefined;
			const selectedQuery = { name: 'abc' };
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(EmptyResultQuery);
		});

		it('should return EmptyResultQuery if first parameter is null value.', () => {
			const testedValue = null;
			const selectedQuery = { name: 'abc' };
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(EmptyResultQuery);
		});

		it('should return passing query if seond parameter is valid query object.', () => {
			const testedValue = 123;
			const selectedQuery = { name: 'abc' };
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(selectedQuery);
		});

		it('should return EmptyResultQuery if seond parameter is invalid query object.', () => {
			const testedValue = 123;
			const selectedQuery = 'abc';
			const result = useQueryIfValueIsDefined(testedValue, selectedQuery);
			expect(result).toEqual(EmptyResultQuery);
		});
	});

	describe('createOrQueryFromList', () => {
		it('should return or query object by passing a array of objects and set valid select key.', () => {
			const arrayOfObjects = [
				{ key1: 'abc', key2: 123 },
				{ key1: 'abc', key2: 123 },
				{ key1: 'abc', key2: 123 },
			];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		// TODO: Maybe it make sense that it fail
		it('should return empty $or query for empty first parameter arrayOfObjects.', () => {
			const arrayOfObjects = [];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});

		it('should return empty $or query for null as first parameter arrayOfObjects.', () => {
			const arrayOfObjects = null;

			// @ts-expect-error: Test case
			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});

		it('should return empty $or query for undefined as first parameter arrayOfObjects.', () => {
			const arrayOfObjects = undefined;

			// @ts-expect-error: Test case
			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});

		it('should return empty $or query for empty object as first parameter arrayOfObjects.', () => {
			const arrayOfObjects = {};

			// @ts-expect-error: Test case
			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove query for array element that has missing key.', () => {
			const invalidObject = { key2: 123 };
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove query for array element that has key with undefined value.', () => {
			const invalidObject = { key2: 123, key1: undefined };
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove query for array element that is empty object.', () => {
			const invalidObject = {};
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove query for array element that is undefined.', () => {
			const invalidObject = undefined;
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove result for array element that is null.', () => {
			const invalidObject = null;
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should remove result for array element that is also an array.', () => {
			const invalidObject = [];
			const arrayOfObjects = [{ key2: 123, key1: 'abc' }, invalidObject, { key2: 123, key1: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'key1', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		// edge case
		it('should not remove result for array element that is also an array with selected key length.', () => {
			const invalidObject = [];
			const arrayOfObjects = [{ key2: 123, length: 'abc' }, invalidObject, { key2: 123, length: 'abc' }];

			const result = createOrQueryFromList(arrayOfObjects, 'length', 'targetKeyXYZ');
			const expectedResult = { $or: [{ targetKeyXYZ: 'abc' }, { targetKeyXYZ: 0 }, { targetKeyXYZ: 'abc' }] };
			expect(result).toEqual(expectedResult);
		});

		it('should empty $or query if selectedKey is not defined.', () => {
			const arrayOfObjects = [
				{ key2: 123, key1: 'abc' },
				{ key2: 123, key1: 'abc' },
				{ key2: 123, key1: 'abc' },
			];

			// @ts-expect-error: Test case
			const result = createOrQueryFromList(arrayOfObjects, undefined, 'targetKeyXYZ');
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});

		it('should empty $or query if selectedKey is not defined.', () => {
			const arrayOfObjects = [
				{ key2: 123, key1: 'abc' },
				{ key2: 123, key1: 'abc' },
				{ key2: 123, key1: 'abc' },
			];

			// @ts-expect-error: Test case
			const result = createOrQueryFromList(arrayOfObjects, 'key1', undefined);
			const expectedResult = { $or: [] };
			expect(result).toEqual(expectedResult);
		});
	});
});
