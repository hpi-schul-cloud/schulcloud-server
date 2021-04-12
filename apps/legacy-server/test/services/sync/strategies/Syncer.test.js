const { expect } = require('chai');

const Syncer = require('../../../../src/services/sync/strategies/Syncer');

describe('Syncer interface', () => {
	it('works', () => new Syncer());

	it('has no steps', async () => {
		const steps = await new Syncer().steps();
		expect(steps).to.equal(undefined);
	});

	describe('sync method', () => {
		it('does nothing and reports success', async () => {
			const result = await new Syncer().sync();
			expect(result.success).to.equal(true);
		});

		it('reports failure on uncaught exception', async () => {
			const mock = new Syncer();
			mock.steps = () =>
				new Promise(() => {
					throw new Error("Don't worry about me");
				});
			const result = await mock.sync();
			expect(result.success).to.equal(false);
		});

		it('reports failure if stats contain errors', async () => {
			const mock = new Syncer();
			mock.steps = () =>
				new Promise((resolve) => {
					mock.stats.errors.push(new Error('Do worry about me'));
					resolve();
				});
			const result = await mock.sync();
			expect(result.success).to.equal(false);
		});
	});

	describe('aggregateStats method', () => {
		it('reports success for a single successful sync', () => {
			const result = Syncer.aggregateStats({ success: true });
			expect(result.successful).to.equal(1);
			expect(result.failed).to.equal(0);
		});

		it('reports failure for a single failed sync', () => {
			const result = Syncer.aggregateStats({ success: false });
			expect(result.successful).to.equal(0);
			expect(result.failed).to.equal(1);
		});

		it('reports failure if success is not explicitly set to true', () => {
			const result = Syncer.aggregateStats({ foo: 'bar', baz: 42 });
			expect(result.successful).to.equal(0);
			expect(result.failed).to.equal(1);
		});

		it('aggregates arrays of sync stats', () => {
			const result = Syncer.aggregateStats([{ success: true }, { success: true }, { success: false }]);
			expect(result.successful).to.equal(2);
			expect(result.failed).to.equal(1);
		});

		it('aggregates recursively', () => {
			const result = Syncer.aggregateStats([
				[{ success: true }, { success: true }, [{ success: false }, [{ success: true }, { success: false }]]],
			]);
			expect(result.successful).to.equal(3);
			expect(result.failed).to.equal(2);
		});
	});
});
