/* eslint-disable promise/no-callback-in-promise */
const chai = require('chai');
const LockingQueue = require('./lockingQueue');

const { expect } = chai;

describe('lockingQueue', () => {
	it('should lock and resolve the returned promise immediatly', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		expect(lockingQueue.locked).to.be.true;
		promise1
			.then(() => {
				return done();
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
	});

	it('should lock and unlock', async () => {
		const lockingQueue = new LockingQueue();
		const lock = await lockingQueue.getLock();
		expect(lockingQueue.locked).to.be.true;
		lock.releaseLock();
		expect(lockingQueue.locked).to.be.false;
	});

	it('if getLock is called twice the second promise should be called after the first is released', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		const promise2 = lockingQueue.getLock();
		let promise1Resolve = false;
		let promise2Resolve = false;

		expect(lockingQueue.locked).to.be.true;
		promise1
			.then((lock) => {
				promise1Resolve = true;
				expect(promise2Resolve, 'Promise 2 not yet resolved').to.be.false;
				expect(lockingQueue.locked, 'locked after promise 1 resolved').to.be.true;
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after first releaseLock').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		promise2
			.then((lock) => {
				promise2Resolve = true;
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(lockingQueue.locked, 'still locked after promise 1 resolved').to.be.true;
				lock.releaseLock();
				expect(lockingQueue.locked, 'not locked after second releaseLock').to.be.false;
				return done();
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
	});

	it('calling releaseLock on same lock twice does not matter', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		lockingQueue.getLock();

		expect(lockingQueue.locked).to.be.true;
		promise1
			.then((lock) => {
				expect(lockingQueue.locked, 'locked after promise 1 resolved').to.be.true;
				lock.releaseLock();
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after calling releaseLock twice').to.be.true;
				done();
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
	});

	it('should resolve one promise at a time whenever "releaseLock" is called', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		const promise2 = lockingQueue.getLock();
		const promise3 = lockingQueue.getLock();
		let promise1Resolve = false;
		let promise2Resolve = false;
		promise1
			.then((lock) => {
				promise1Resolve = true;
				expect(promise2Resolve, 'Promise 2 not yet resolved').to.be.false;
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after 1st releaseLock()').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		promise2
			.then((lock) => {
				promise2Resolve = true;
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after 2nd releaseLock()').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		const promise4 = lockingQueue.getLock();
		promise3
			.then((lock) => {
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(promise2Resolve, 'Promise 2 already resolved').to.be.true;
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after 3rd releaseLock()').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});


		promise4
			.then((lock) => {
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(promise2Resolve, 'Promise 2 already resolved').to.be.true;
				lock.releaseLock();
				expect(lockingQueue.locked, 'still locked after 4th releaseLock()').to.be.false;
				return done();
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
	});
});
