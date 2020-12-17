const { Types } = require('mongoose').Schema;
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

const equals = (v1, v2) => {
	if (v1 instanceof Types.ObjectId) {
		return v1.toString() === v2.toString();
	}
	return v1 === v2;
};

function immutableField(field) {
	return function failOnChange(value) {
		if (this[field] && value && !equals(this[field], value)) {
			throw new Forbidden(`The field ${field} is immutable.`);
		}
		return this[field] || value;
	};
}

function immutableFieldPlugin(schema, options) {
	const props = schema.tree;
	Object.keys(props).forEach((prop) => {
		if (props[prop].immutable) {
			schema.path(prop).set(immutableField(prop));
		}
	});
}

module.exports = { immutableFieldPlugin };
