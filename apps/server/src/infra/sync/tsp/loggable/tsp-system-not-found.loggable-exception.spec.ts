import { TspSystemNotFoundLoggableException } from './tsp-system-not-found.loggable-exception';

describe(TspSystemNotFoundLoggableException.name, () => {
	let loggable: TspSystemNotFoundLoggableException;

	beforeAll(() => {
		loggable = new TspSystemNotFoundLoggableException();
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: 'The TSP system could not be found during the sync',
				type: 'TSP_SYSTEM_NOT_FOUND',
				stack: expect.any(String),
			});
		});
	});
});
