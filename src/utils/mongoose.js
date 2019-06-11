const { Forbidden } = require('@feathersjs/errors');

function immutableField(field) {
	return function setOrKeep(value) {
		if (this[field] && value && this[field] !== value) {
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
