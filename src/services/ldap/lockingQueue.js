class LockingQueue {
	constructor() {
		this.locked = false;
		this.queue = [];
	}

	createDeferredPromise() {
		const deferred = {
			promise: null,
			resolve: null,
			reject: null,
		};

		deferred.promise = new Promise((resolve, reject) => {
			deferred.resolve = resolve;
			deferred.reject = reject;
		});

		return deferred;
	}

	getLock() {
		if (!this.locked) {
			this.locked = true;
			return Promise.resolve;
		}
		const { resolve, promise: deferredPromise } = this.createDeferredPromise();
		this.queue.push({
			resolve,
		});
		return deferredPromise;
	}

	releaseLock() {
		if (this.queue.length === 0) {
			this.locked = false;
		}
		if (this.queue.length > 0) {
			this.queue.shift().resolve();
		}
	}
}

module.exports = LockingQueue;
