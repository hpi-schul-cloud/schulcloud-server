const logger = require('../../logger');

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const isF = (e) => typeof e === 'function';
const isValidCacheMap = (cacheMap) => {
	const {
		get, set, keys, delete: d,
	} = cacheMap;
	return isF(get) && isF(set) && isF(keys) && isF(d);
};

const isGetFind = (context) => ['get', 'find'].includes(context.method);

const splitString = '::';
const findString = '<find>';

const getIndex = (context) => {
	const id = (context.id || findString).toString();
	return id + splitString + JSON.stringify(context.params.query);
};
// cacheMap must be include a get(), set(), keys(), delete()  P
const sendFromCache = (cacheMap, logging = false) => (context) => {
	if (!isGetFind(context)) {
		return context;
	}
	// only match if id + query is matched, query is sorted
	const value = cacheMap.get(getIndex(context));
	if (value) {
		// to skip the database call context.result can be set in a before hook.
		context.resultFromCache = true;
		context.result = value;
		if (logging) {
			logger.info('Result is send from cache.');
		}
	}

	return context;
};

const clearCacheAfterModified = (cacheMap) => (context) => {
	if (isGetFind(context)) {
		return context;
	}
	const id = (context.id || '').toString();
	// delete every that is related to the modified id
	cacheMap.keys().forEach((index) => {
		const selector = index.split(splitString)[0];
		if (selector === findString || selector === id) {
			cacheMap.delete(index);
		}
	});
	return context;
};

const saveToCache = (cacheMap) => (context) => {
	if (!isGetFind(context) || context.resultFromCache === true) {
		return context;
	}
	cacheMap.set(getIndex(context), clone(context.result));
	return context;
};

module.exports = (cacheMap, { logging = false } = {}) => {
	if (isValidCacheMap(cacheMap)) {
		return {
			sendFromCache: sendFromCache(cacheMap, logging),
			clearCacheAfterModified: clearCacheAfterModified(cacheMap),
			saveToCache: saveToCache(cacheMap),
		};
	}
	return {};
};
