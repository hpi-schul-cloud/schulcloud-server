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
			return Promise.resolve();
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
