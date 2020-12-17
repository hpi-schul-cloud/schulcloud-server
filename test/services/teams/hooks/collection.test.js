const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const {
	isArray,
	isArrayWithElement,
	isObject,
	isString,
	hasKey,
	isDefined,
	isUndefined,
	isNull,
	isObjectId,
	isObjectIdWithTryToCast,
	throwErrorIfNotObjectId,
	bsonIdToString,
	isSameId,
	isFunction,
} = require('../../../../src/services/teams/hooks/collection.js');

describe('collection helpers', () => {
	describe('isArray', () => {
		it('returns true for empty arrays', () => {
			expect(isArray([])).to.equal(true);
		});

		it('returns true for given arrays', () => {
			expect(isArray([1, 2, 3])).to.equal(true);
			expect(isArray(['a', 'b', 4, 5])).to.equal(true);
		});

		it('returns false for non-arrays', () => {
			expect(isArray({})).to.equal(false);
			expect(isArray(1)).to.equal(false);
			expect(isArray('Hello World')).to.equal(false);
		});

		it('works for huge arrays', () => {
			const array = new Array(2 ** 20).fill(1);
			expect(isArray(array)).to.equal(true);
		});
	});

	describe('isArrayWithElement', () => {
		it('returns false for empty arrays', () => {
			expect(isArrayWithElement([])).to.equal(false);
		});

		it('returns true for given arrays', () => {
			expect(isArrayWithElement([1, 2, 3])).to.equal(true);
			expect(isArrayWithElement(['a', 'b', 4, 5])).to.equal(true);
		});

		it('returns false for non-arrays', () => {
			expect(isArrayWithElement({})).to.equal(false);
			expect(isArrayWithElement(1)).to.equal(false);
			expect(isArrayWithElement('Hello World')).to.equal(false);
		});

		it('works for huge arrays', () => {
			const array = new Array(2 ** 20).fill(1);
			expect(isArrayWithElement(array)).to.equal(true);
		});
	});

	describe('isObject', () => {
		it('returns true for plain objects', () => {
			expect(isObject({})).to.equal(true);
			expect(isObject({ a: 123, b: 42 })).to.equal(true);
		});

		it('returns false for other types', () => {
			expect(isObject(123)).to.equal(false);
			expect(isObject([1, 2, 3])).to.equal(false);
			expect(isObject('foo bar')).to.equal(false);
		});
	});

	describe('isString', () => {
		it('should return true for strings', () => {
			expect(isString('')).to.equal(true);
			expect(isString('foobar')).to.equal(true);
		});

		it('should return false for other types', () => {
			expect(isString(123)).to.equal(false);
			expect(isString([])).to.equal(false);
			expect(isString(new Promise(() => {}))).to.equal(false);
			expect(isString(() => {})).to.equal(false);
		});
	});

	describe('hasKey', () => {
		it('should return true if a given object has a given key', () => {
			expect(hasKey({ a: 'b' }, 'a')).to.equal(true);
			expect(hasKey({ foo: 123 }, 'foo')).to.equal(true);
		});

		it('should return false otherwise', () => {
			expect(hasKey({}, 'foo')).to.equal(false);
			expect(hasKey({ a: 123 }, 'b')).to.equal(false);
			expect(hasKey(this, 4)).to.equal(false);
		});

		it('should not break due to broken arguments', () => {
			expect(hasKey()).to.equal(false);
			expect(hasKey({}, undefined)).to.equal(false);
			expect(hasKey(undefined, 4)).to.equal(false);
		});
	});

	describe('isDefined', () => {
		it('should work', () => {
			expect(isDefined(undefined)).to.equal(false);
			expect(isDefined(null)).to.equal(true);
			expect(isDefined(1)).to.equal(true);
			expect(isDefined(true)).to.equal(true);
			expect(isDefined(false)).to.equal(true);
			expect(isDefined({})).to.equal(true);
		});

		it('should work for lists of values', () => {
			expect(isDefined([1, 2], 'AND')).to.equal(true);
			expect(isDefined([3, 4], 'OR')).to.equal(true);
			expect(isDefined([undefined, 4], 'AND')).to.equal(false);
			expect(isDefined([undefined, 5], 'OR')).to.equal(true);
			expect(isDefined([undefined, undefined], 'OR')).to.equal(false);
		});
	});

	describe('isUndefined', () => {
		it('should work', () => {
			expect(isUndefined(undefined)).to.equal(true);
			expect(isUndefined(null)).to.equal(false);
			expect(isUndefined(1)).to.equal(false);
			expect(isUndefined(true)).to.equal(false);
			expect(isUndefined(false)).to.equal(false);
			expect(isUndefined({})).to.equal(false);
		});

		it('should work for lists of values', () => {
			expect(isUndefined([1, 2], 'AND')).to.equal(false);
			expect(isUndefined([3, 4], 'OR')).to.equal(false);
			expect(isUndefined([undefined, 4], 'AND')).to.equal(false);
			expect(isUndefined([undefined, 5], 'OR')).to.equal(true);
			expect(isUndefined([undefined, undefined], 'OR')).to.equal(true);
		});
	});

	describe('isNull', () => {
		it('should work', () => {
			expect(isNull(undefined)).to.equal(false);
			expect(isNull(null)).to.equal(true);
			expect(isNull(1)).to.equal(false);
			expect(isNull(true)).to.equal(false);
			expect(isNull(false)).to.equal(false);
			expect(isNull({})).to.equal(false);
		});
	});

	describe('isObjectId', () => {
		it('should return true for MongoDB ObjectIds', () => {
			const oid = new ObjectId();
			expect(isObjectId(oid)).to.equal(true);
		});

		it('should return false for other types', () => {
			const oid = new ObjectId();
			expect(isObjectId(oid.toString())).to.equal(false);
			expect(isObjectId('5c3da7980ba3be0a64f1d38c')).to.equal(false);
			expect(isObjectId({ _bsontype: 'ObjectID' })).to.equal(false);
			expect(isObjectId(123)).to.equal(false);
			expect(isObjectId('123')).to.equal(false);
			expect(isObjectId(() => {})).to.equal(false);
			expect(isObjectId([])).to.equal(false);
		});
	});

	describe('isObjectIdWithTryToCast', () => {
		it('should return true if parameters can be cast to MongoDB ObjectIds', () => {
			const oid = new ObjectId();
			expect(isObjectIdWithTryToCast(oid)).to.equal(true);
			expect(isObjectIdWithTryToCast(oid.toString())).to.equal(true);
		});

		it('should return false for other types', () => {
			expect(isObjectIdWithTryToCast(123)).to.equal(false);
			expect(isObjectIdWithTryToCast('5c3da7980ba3be0a64f1d38ca')).to.equal(false);
			expect(isObjectIdWithTryToCast({ _bsontype: 'ObjectID' })).to.equal(false);
			expect(isObjectIdWithTryToCast('123')).to.equal(false);
			expect(isObjectIdWithTryToCast(() => {})).to.equal(false);
			expect(isObjectIdWithTryToCast([])).to.equal(false);
		});
	});

	describe('throwErrorIfNotObjectId', () => {
		it('does nothing for valid ObjectIds', () => {
			throwErrorIfNotObjectId(new ObjectId());
		});

		it('throws a BadRequest error if applicable', () => {
			expect(() => throwErrorIfNotObjectId('foobar')).to.throw(BadRequest);
			expect(() => throwErrorIfNotObjectId(1234)).to.throw(BadRequest);
		});
	});

	describe('bsonIdToString', () => {
		it('should convert a single Id', () => {
			const oid = new ObjectId();
			expect(bsonIdToString(oid)).to.equal(oid.toString());
		});

		it('should convert arrays of Ids', () => {
			const oids = new Array(5).fill(new ObjectId());
			const expectedResult = oids.map((i) => i.toString());
			expect(bsonIdToString(oids)).to.deep.equal(expectedResult);
		});

		it('should work for stringified Ids', () => {
			const s = new ObjectId().toString();
			expect(bsonIdToString(s)).to.equal(s);
		});

		it('should not break on broken arguments', () => {
			expect(() => bsonIdToString(undefined)).to.not.throw();
			expect(() => bsonIdToString('foobar')).to.not.throw();
			expect(() => bsonIdToString(123)).to.not.throw();
		});
	});

	describe('isSameId', () => {
		it('should return true for equal ObjectIds', () => {
			const oid = new ObjectId();
			expect(isSameId(oid, oid)).to.equal(true);
			expect(isSameId(oid, oid.toString())).to.equal(true);
			expect(isSameId(oid.toString(), oid.toString())).to.equal(true);
		});

		it('should return false for different ObjectIds', () => {
			const oid1 = new ObjectId();
			const oid2 = new ObjectId();
			expect(isSameId(oid1, oid2)).to.equal(false);
			expect(isSameId(oid1, oid2.toString())).to.equal(false);
			expect(isSameId(oid1, 123)).to.equal(false);
		});
	});

	describe('isFunction', () => {
		it('should return true for function types', () => {
			expect(isFunction(() => {})).to.equal(true);
			expect(isFunction(() => {})).to.equal(true);
			expect(isFunction(new Function())).to.equal(true);
		});

		it('should return false for other types', () => {
			expect(isFunction(1243)).to.equal(false);
			expect(isFunction('foo bar')).to.equal(false);
			expect(isFunction([])).to.equal(false);
		});
	});
});
