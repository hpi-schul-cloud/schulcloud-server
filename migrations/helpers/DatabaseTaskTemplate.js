class DatabaseTaskTempalte {
	constructor({
		id,
		_id,
		$set,
		set,
		$unset,
		unset,
	}) {
		this.id = _id || id;
		this.set = $set || set || {};
		this.unset = $unset || unset || {};
	}

	getId() {
		return { _id: this.id };
	}

	get() {
		return {
			$set: this.set,
			$unset: this.unset,
		};
	}

	pushSet(key, value) {
		this.set[key] = value;
	}

	pushUnset(key) {
		this.unset[key] = 1;
	}

	exec(model, operation, log) {
		// LessonModel.updateOne(task.getId(), task.get()
		return model[operation](this.getId(), this.get())
			.then(() => {
				if (log) {
					return log.pushModified(this.id);
				}
				return true;
			})
			.catch(() => {
				if (log) {
					return log.pushFail(this.id);
				}
				return false;
			});
	}
}

module.exports = DatabaseTaskTempalte;
