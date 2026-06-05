import { UpdateRuntimeConfigLoggable } from './update-runtime-config.loggable';

describe('UpdateRuntimeConfigLoggable', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const userId = 'test-user-id';
			const key = 'TEST_KEY';
			const givenValue = 'given-value';
			const persistedValue = 'persisted-value';
			const loggable = new UpdateRuntimeConfigLoggable(userId, key, givenValue, persistedValue);

			expect(loggable).toEqual({
				userId,
				key,
				givenValue,
				persistedValue,
			});
			expect(loggable.getLogMessage()).toStrictEqual({
				data: { userId, key, givenValue, persistedValue },
				message: 'Runtime config updated',
			});
		});
	});
});
