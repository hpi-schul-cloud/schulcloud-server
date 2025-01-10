import { SyncStrategyTarget } from '../sync-strategy.types';
import { InvalidTargetLoggable } from './invalid-target.loggable';

describe(InvalidTargetLoggable.name, () => {
	let loggable: InvalidTargetLoggable;

	beforeAll(() => {
		loggable = new InvalidTargetLoggable('invalid-target');
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message with the entered target and available targets', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: 'Either synchronization is not activated or the target entered is invalid',
				data: {
					enteredTarget: 'invalid-target',
					availableTargets: SyncStrategyTarget,
				},
			});
		});
	});
});
