const { ObjectId } = require('mongoose').Types;
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

/**
 * If Array use it.
 * If Object use Object.keys.
 * Otherwise create array with one element.
 * @private
 * @collection
 */
const mapToArray = (e) => (isArray(e) ? e : isObject(e) ? Object.values(e) : [e]);

/**
 * @private
 * @collection
 * @param {Array} array
 * @param {Function} execute
 * @param {*} additional Is a value that is pass as second parameter to the executed function.
 */
const batch = (array, execute, additional) => mapToArray(array).map((e) => execute(e, additional));

/**
 * Test if any of the elements in this function are true
 * @private
 * @collection
 * @param {Array::Boolean} arrayOfBools
 * @return {Boolean}
 */
const allTrue = (arrayOfBools) => !arrayOfBools.some((b) => b === false);

/**
 * Test if one of the elements in this function are true
 * @private
 * @collection
 * @param {Array::Boolean} arrayOfBools
 * @return {Boolean}
 */
const oneTrue = (arrayOfBools) => arrayOfBools.some((b) => b === true);

/**
 * @collection
 */
const isArray = (array) => Array.isArray(array);

/**
 * @collection
 */
const isArrayWithElement = (array) => {
	try {
		return isArray(array) && array.length > 0;
	} catch (err) {
		return false;
	}
};

/**
 * @collection
 * */
const isObject = (e) => typeof e === 'object' && !isArray(e);

/**
 * @collection
 * */
const isString = (e) => typeof e === 'string';

/**
 * @collection
 * */
const isFunction = (e) => typeof e === 'function';

/**
 * @collection
 */
const hasKey = (e, key) => isObject(e) && e[key] !== undefined;

/**
 * @private
 * @collection
 */
const isDefined = (e) => e !== undefined;

/**
 * @private
 * @collection
 */
const isAllDefined = (e) => allTrue(batch(e, isDefined));

/**
 * @private
 * @collection
 */
const isOneDefined = (e) => oneTrue(batch(e, isDefined));

/**
 * @private
 * @collection
 */
const isUndefined = (e) => e === undefined;

/**
 * @private
 * @collection
 */
const isAllUndefined = (e) => allTrue(batch(e, isUndefined));

/**
 * @private
 * @collection
 */
const isOneUndefined = (e) => oneTrue(batch(e, isUndefined));

/**
 * @collection
 */
const isNull = (e) => e === null;

/**
 * Can be also used to test if string is a valid id
 * @collection
 * @private
 * @param {String} id
 * @return {String::ObjectId} Return null if can not created
 */
const tryToCastToObjectId = (id) => {
	try {
		return ObjectId(id);
	} catch (err) {
		return null;
	}
};

/**
 * @collection
 * @requires const Schema = require('mongoose').Schema;
 */
const isObjectId = (id) => id instanceof ObjectId && id !== undefined;

/**
 * @collection
 * @requires const Schema = require('mongoose').Schema;
 */
const isObjectIdWithTryToCast = (id) => isObjectId(id) || !isNull(tryToCastToObjectId((id || '').toString()));

/**
 *   @collection
 *   @throws {BadRequest} If input is no typeof moongose Schema.Types.ObjectId
 *                       or a String that can cast to this schema, it is throw an error
 */
const throwErrorIfNotObjectId = (id) => {
	if (!isObjectIdWithTryToCast(id)) {
		throw new BadRequest('Is not instance of Schema.Types.ObjectId.');
	}
};

/**
 * Convert bsonId(s) to stringId(s),
 * @collection
 * @param {Array::(bson||string) || (bson||sring)} input
 * @returns {Array::String::Id || String::Id}
 */
const bsonIdToString = (input) => {
	let out;
	if (isArray(input)) {
		out = input.map((id) => id.toString());
	} else if (isDefined(input)) {
		out = input.toString();
	} else {
		out = input;
	}
	return out;
};

/**
 * Convert bsonIds to strings and test if itput is the same
 * @collection
 * @param {StringId||BsonId} value1
 * @param {StringId||BsonId} value2
 */
const isSameId = (value1, value2) => bsonIdToString(value1) === bsonIdToString(value2);

/**
 * @collection
 * @param {*} e
 * @param {String::'AND'||'OR'} operation
 */
const isDefinedOperation = (e, operation) => {
	let out;
	if (operation === 'OR') {
		out = isOneDefined(e);
	} else if (operation === 'AND') {
		out = isAllDefined(e);
	} else {
		out = isDefined(e);
	}
	return out;
};

/**
 * @collection
 * @param {*} e
 * @param {String::'AND'||'OR'} operation AND || OR
 */
const isUndefinedOperation = (e, operation) => {
	let out;
	if (operation === 'OR') {
		out = isOneUndefined(e);
	} else if (operation === 'AND') {
		out = isAllUndefined(e);
	} else {
		out = isUndefined(e);
	}
	return out;
};

module.exports = {
	isArray,
	isArrayWithElement,
	isObject,
	isString,
	hasKey,
	isDefined: isDefinedOperation,
	isUndefined: isUndefinedOperation,
	isNull,
	isObjectId,
	isObjectIdWithTryToCast,
	throwErrorIfNotObjectId,
	bsonIdToString, // todo: rename  ?toIdString ?
	isSameId,
	isFunction,
};
