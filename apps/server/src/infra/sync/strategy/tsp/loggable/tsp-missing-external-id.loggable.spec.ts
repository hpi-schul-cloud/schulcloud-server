import { TspMissingExternalIdLoggable } from './tsp-missing-external-id.loggable';

describe(TspMissingExternalIdLoggable.name, () => {
	let loggable: TspMissingExternalIdLoggable;

	beforeAll(() => {
		loggable = new TspMissingExternalIdLoggable('teacher');
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `A teacher is missing an id. It is skipped.`,
				data: {
					objectType: 'teacher',
				},
			});
		});
	});
});
