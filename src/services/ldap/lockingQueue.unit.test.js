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

	it('should lock and unlock', (done) => {
		const lockingQueue = new LockingQueue();
		lockingQueue.getLock();
		expect(lockingQueue.locked).to.be.true;
		lockingQueue.releaseLock();
		expect(lockingQueue.locked).to.be.false;
		done();
	});

	it('if getLock is called twice the second promise should be called after the first is released', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		const promise2 = lockingQueue.getLock();
		let promise1Resolve = false;
		let promise2Resolve = false;

		expect(lockingQueue.locked).to.be.true;
		promise1
			.then(() => {
				promise1Resolve = true;
				expect(promise2Resolve, 'Promise 2 not yet resolved').to.be.false;
				expect(lockingQueue.locked, 'still locked after promise 1 resolved').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		promise2
			.then(() => {
				promise2Resolve = true;
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(lockingQueue.locked, 'not locked after both promises resolved').to.be.false;
				return done();
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		lockingQueue.releaseLock();
		expect(lockingQueue.locked, 'still locked after first releaseLock').to.be.true;
		lockingQueue.releaseLock();
	});

	it('should resolve one promise at a time whenever "releaseLock" is called', (done) => {
		const lockingQueue = new LockingQueue();
		const promise1 = lockingQueue.getLock();
		const promise2 = lockingQueue.getLock();
		const promise3 = lockingQueue.getLock();
		let promise1Resolve = false;
		let promise2Resolve = false;
		promise1
			.then(() => {
				promise1Resolve = true;
				expect(promise2Resolve, 'Promise 2 not yet resolved').to.be.false;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		promise2
			.then(() => {
				promise2Resolve = true;
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});
		promise3
			.then(() => {
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(promise2Resolve, 'Promise 21 already resolved').to.be.true;
				return '';
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});

		lockingQueue.releaseLock();
		expect(lockingQueue.locked, 'still locked after 1st releaseLock()').to.be.true;

		const promise4 = lockingQueue.getLock();
		promise4
			.then(() => {
				expect(promise1Resolve, 'Promise 1 already resolved').to.be.true;
				expect(promise2Resolve, 'Promise 21 already resolved').to.be.true;
				return done();
			})
			.catch(() => {
				expect.fail('unexpected failed promise');
			});

		lockingQueue.releaseLock();
		expect(lockingQueue.locked, 'still locked after 2nd releaseLock()').to.be.true;
		lockingQueue.releaseLock();
		expect(lockingQueue.locked, 'still locked after 3rd releaseLock()').to.be.true;
		lockingQueue.releaseLock();
	});
});
