import { getResolvedValues, isFulfilled } from './promise';

describe('Promise Helper', () => {
	describe('isFullFilled is called', () => {
		describe('promise is fullfilled', () => {
			const setup = async () => {
				const promise = Promise.resolve('value');
				const promises = await Promise.allSettled([promise]);
				const settledPromise = promises[0];

				return settledPromise;
			};

			it('should return true', async () => {
				const settledPromise = await setup();

				const result = isFulfilled(settledPromise);

				expect(result).toBe(true);
			});
		});

		describe('promise is rejected', () => {
			const setup = async () => {
				const promise = Promise.reject();
				const promises = await Promise.allSettled([promise]);
				const settledPromise = promises[0];

				return settledPromise;
			};

			it('should return false', async () => {
				const settledPromise = await setup();

				const result = isFulfilled(settledPromise);

				expect(result).toBe(false);
			});
		});
	});

	describe('getResolvedValues is called', () => {
		describe('receives fullfilled promises only', () => {
			const setup = async () => {
				const value1 = 'value1';
				const value2 = 'value2';
				const promise1 = Promise.resolve(value1);
				const promise2 = Promise.resolve(value2);
				const promises = await Promise.allSettled([promise1, promise2]);

				return { promises, value1, value2 };
			};

			it('should return value1 and value2', async () => {
				const { promises, value1, value2 } = await setup();

				const result = getResolvedValues(promises);

				expect(result).toEqual([value1, value2]);
			});
		});

		describe('receives fullfilled and rejected promises', () => {
			const setup = async () => {
				const value2 = 'value2';
				const promise1 = Promise.reject();
				const promise2 = Promise.resolve(value2);
				const promises = await Promise.allSettled([promise1, promise2]);

				return { promises, value2 };
			};

			it('should return array with value2', async () => {
				const { promises, value2 } = await setup();

				const result = getResolvedValues(promises);

				expect(result).toEqual([value2]);
			});
		});

		describe('receives rejected promises only', () => {
			const setup = async () => {
				const promise1 = Promise.reject();
				const promises = await Promise.allSettled([promise1]);

				return { promises };
			};

			it('should return empty array', async () => {
				const { promises } = await setup();

				const result = getResolvedValues(promises);

				expect(result).toEqual([]);
			});
		});
	});
});
