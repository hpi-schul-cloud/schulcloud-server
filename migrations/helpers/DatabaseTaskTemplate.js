const ifNotFunction = (e) => !typeof e === 'function';

const testLogger = (log = {}) => {
	if (ifNotFunction(log.pushModified) || ifNotFunction(log.pushFail)) {
		throw new Error('Is not a valid logger. It need the methods pushModified and pushFail.');
	}
	return log;
};

class DatabaseTaskTemplate {
	constructor({ id, _id, $set, set, $unset, unset, isModified = true, log }) {
		this.id = _id || id;
		this.set = $set || set || {};
		this.unset = $unset || unset || {};
		this.isModified = isModified;

		this.log = log;
	}

	setLog(log) {
		this.log = log;
	}

	getId() {
		return { _id: this.id };
	}

	get() {
		const req = {};
		if (Object.keys(this.set).length > 0) {
			req.$set = this.set;
		}
		if (Object.keys(this.unset).length > 0) {
			req.$unset = this.unset;
		}
		return req;
	}

	pushSet(key, value) {
		this.set[key] = value;
	}

	pushUnset(key) {
		this.unset[key] = 1;
	}

	exec(model, operation, _log) {
		const log = _log || this.log;

		if (this.isModified === false) {
			return Promise.resolve(true);
		}

		return model[operation](this.getId(), this.get())
			.then(() => {
				if (log) {
					return testLogger(log).pushModified(this.getId());
				}
				return true;
			})
			.catch((err) => {
				if (log) {
					return testLogger(log).pushFail(this.getId(), err);
				}
				return false;
			});
	}
}

module.exports = DatabaseTaskTemplate;
