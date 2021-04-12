const { ObjectId } = require('mongoose').Types;

const maxDeep = 12;

const deepTransformToDataTransferObject = (data, depth = 0) => {
	if (depth >= maxDeep) {
		throw new Error('Data level is to deep. (transformToDataTransferObject)');
	}
	if (Array.isArray(data)) {
		return data.map((el) => {
			if (el instanceof Date) {
				return el.toISOString();
			}
			if (el instanceof ObjectId) {
				return el.toString();
			}
			if (el instanceof Object) {
				return deepTransformToDataTransferObject(el, depth + 1);
			}
			if (Array.isArray(el)) {
				return deepTransformToDataTransferObject(el, depth + 1);
			}
			return el;
		});
	}
	for (const key in data) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			if (data[key] instanceof Date) {
				data[key] = data[key].toISOString();
			}
			if (data[key] instanceof ObjectId) {
				data[key] = data[key].toString();
			}
			if (Array.isArray(data[key])) {
				data[key] = deepTransformToDataTransferObject(data[key], depth + 1);
			}
			if (data[key] instanceof Object) {
				data[key] = deepTransformToDataTransferObject(data[key], depth + 1);
			}
		}
	}
	return data;
};

const transformToDataTransferObject = (context) => {
	deepTransformToDataTransferObject(context.result);
	return context;
};

module.exports = {
	transformToDataTransferObject,
};
