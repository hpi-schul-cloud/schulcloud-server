/**
 * Used for locking a resource. The LockingQueue has no reference to the resource itself.
 * getLock() will return a promise, that resolves when it is the clients's turn to use the resource.
 *
 * Once the resource is no longer needed releaseLock() needs to be called. The next client's promise will be resolved.
 *
 * E.g.
 * client 1 calls getLock() and is returned a promise that resolves immediatly.
 * client 2 calls getLock() and is returned a promise that stays unresolved for now.
 * client 3 calls getLock() and is returned a promise that stays unresolved for now.
 * client 1 calls releaseLock(). client 2's promise resolves.
 * client 2 calls releaseLock(). client 3's promise resolves.
 * client 3 calls releaseLock().
 * client 4 calls getLock() and is returned a promise that resolves immediatly.
 */
class LockingQueue {
	constructor() {
		this.locked = false;
		this.queue = [];
	}

	createDeferredPromise(promisePayload) {
		const deferred = {
			promise: null,
			resolve: null,
			reject: null,
		};

		deferred.promise = new Promise((resolve, reject) => {
			deferred.resolve = () => {
				resolve(promisePayload);
			};
			deferred.reject = reject;
		});

		return deferred;
	}

	getLock() {
		const that = this;
		const releaseObject = (function () {
			let released = false;
			return {
				releaseLock: function releaseLock() {
					if (!released) {
						released = true;
						if (that.queue.length === 0) {
							that.locked = false;
						}
						if (that.queue.length > 0) {
							that.queue.shift().resolve();
						}
					}
				},
			};
		})();

		if (!this.locked) {
			this.locked = true;
			return Promise.resolve(releaseObject);
		}
		const { resolve, promise: deferredPromise } = this.createDeferredPromise(releaseObject);
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
