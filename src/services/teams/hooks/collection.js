const mongoose = require('mongoose');
const Schema = mongoose.Schema;
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
 * @collection
 */
const isDefined = (e) => {
    return e !== undefined;
};

/**
 * @collection
 */
const isUndefined = (e) => {
    return e === undefined;
};

/**
 * @collection
 */
const isNull = (e) => {
    return e === null;
};

/**
 * Can be used to test if string is a valid id
 * @collection
 * @param {String} id 
 * @return {String::ObjectId} Return null if can not created
 */
const createObjectId = (id) => {
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
    return isObjectId(id) || !isNull(createObjectId(id));
};

/**
*   @collection
*   @return {boolean default=true} - otherwise see @throws
*   @throws {BadRequest} - If input is no typeof moongose Schema.Types.ObjectId it is throw an error
*/
const throwErrorIfNotObjectId = (id) => {
    if (isObjectId(id))
        throw new errors.BadRequest('Wrong input. (5)');
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

module.exports = {
    isArray,
    isArrayWithElement,
    isObject,
    isString,
    hasKey,
    isDefined,
    isUndefined,    //todo: rename isNot_Defined
    isNull,
    createObjectId,
    isObjectId,
    isObjectIdWithTryToCast,
    throwErrorIfNotObjectId,
    bsonIdToString,     //todo: rename  ?toIdString ?
    isSameId,
    isFunction
};