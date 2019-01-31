const mongoose = require('mongoose');
const errors = require('feathers-errors');
const Schema = mongoose.Schema;

/**
 * If Array use it.
 * If Object use Object.keys.
 * Otherwise create array with one element.
 * @private
 * @collection
 */
const mapToArray = (e) => {
    return isArray(e) ? e : isObject(e) ? Object.values(e) : [e];
};

/**
 * @private
 * @collection
 * @param {Array} array
 * @param {Function} execute
 * @param {*} additional Is a value that is pass as second parameter to the executed function.
 */
const batch = (array, execute, additional) => {
    return (mapToArray(array)).map(e => {
        return execute(e, additional);
    });
};

/**
 * Test if any of the elements in this function are true
 * @private
 * @collection
 * @param {Array::Boolean} arrayOfBools
 * @return {Boolean}
 */
const allTrue = (arrayOfBools) => {
    return !arrayOfBools.some(b => b === false);
};

/**
 * Test if one of the elements in this function are true
 * @private
 * @collection
 * @param {Array::Boolean} arrayOfBools
 * @return {Boolean}
 */
const oneTrue = (arrayOfBools) => {
    return arrayOfBools.some(b => b === true);
};

/**
 * @collection
 */
const isArray = (array) => {
    return Array.isArray(array);
};

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
 */
const isObject = (e) => {
    return typeof e === 'object' && !isArray(e);
};

/**
 * @collection
 */
const isString = (e) => {
    return typeof e === 'string';
};

/**
 * @collection
 */
const isFunction = (e) => {
    return typeof e === 'function';
};

/**
 * @collection
 */
const hasKey = (e, key) => {
    return isObject(e) && e[key] !== undefined;
};

/**
 * @private
 * @collection
 */
const isDefined = (e) => {
    return e !== undefined;
};

/**
 * @private
 * @collection
 */
const isAllDefined = (e) => {
    return allTrue(batch(e, isDefined));
};

/**
 * @private
 * @collection
 */
const isOneDefined = (e) => {
    return oneTrue(batch(e, isDefined));
};

/**
 * @private
 * @collection
 */
const isUndefined = (e) => {
    return e === undefined;
};

/**
 * @private
 * @collection
 */
const isAllUndefined = (e) => {
    return allTrue(batch(e, isUndefined));
};

/**
 * @private
 * @collection
 */
const isOneUndefined = (e) => {
    return oneTrue(batch(e, isUndefined));
};

/**
 * @collection
 */
const isNull = (e) => {
    return e === null;
};

/**
 * Can be also used to test if string is a valid id
 * @collection
 * @private
 * @param {String} id 
 * @return {String::ObjectId} Return null if can not created
 */
const tryToCastToObjectId = (id) => {
    try {
        return mongoose.Types.ObjectId(id);
    } catch (err) {
        return null;
    }
};

/**
 * @collection
 * @requires const Schema = require('mongoose').Schema;
 */
const isObjectId = (id) => {
    return id instanceof Schema.Types.ObjectId && id !== undefined;
};

/**
 * @collection
 * @requires const Schema = require('mongoose').Schema;
 */
const isObjectIdWithTryToCast = (id) => {
    return isObjectId(id) || !isNull(tryToCastToObjectId(id));
};

/**
*   @collection
*   @throws {BadRequest} - If input is no typeof moongose Schema.Types.ObjectId it is throw an error
*/
const throwErrorIfNotObjectId = (id) => {
    if (isObjectId(id))
        throw new errors.BadRequest('Is not instance of Schema.Types.ObjectId.');
};

/**
 * Convert bsonId(s) to stringId(s),
 * @collection
 * @param {Array::(bson||string) || (bson||sring)} input 
 * @returns {Array::String::Id || String::Id}
 */
const bsonIdToString = (input) => {
    if (isArray(input)) {
        return input.map(id => {
            return id.toString();
        });
    } else if (isDefined(input)) {
        return input.toString();
    } else {
        return input;
    }
};

/**
 * Convert bsonIds to strings and test if itput is the same
 * @collection
 * @param {StringId||BsonId} value1 
 * @param {StringId||BsonId} value2 
 */
const isSameId = (value1, value2) => {
    return bsonIdToString(value1) === bsonIdToString(value2);
};

/**
 * @collection
 * @param {*} e 
 * @param {String::'AND'||'OR'} operation 
 */
const isDefinedOperation = (e, operation) => {
    if (operation === 'OR')
        return isOneDefined(e);
    else if (operation === 'AND')
        return isAllDefined(e);
    else
        return isDefined(e);
};

/**
 * @collection
 * @param {*} e 
 * @param {String::'AND'||'OR'} operation AND || OR
 */
const isUndefinedOperation = (e, operation) => {
    if (operation === 'OR')
        return isOneUndefined(e);
    else if (operation === 'AND')
        return isAllUndefined(e);
    else
        return isUndefined(e);
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
    bsonIdToString,     //todo: rename  ?toIdString ?
    isSameId,
    isFunction
};