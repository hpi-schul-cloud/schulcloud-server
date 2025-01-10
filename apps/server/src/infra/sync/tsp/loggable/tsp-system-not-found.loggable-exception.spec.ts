import { TspSystemNotFoundLoggableException } from './tsp-system-not-found.loggable-exception';

describe(TspSystemNotFoundLoggableException.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const expected = {
				message: 'The TSP system could not be found during the sync',
				type: 'TSP_SYSTEM_NOT_FOUND',
				stack: expect.any(String),
			};

			return { expected };
		};

		it('should return a log message', () => {
			const { expected } = setup();

			const loggable = new TspSystemNotFoundLoggableException();

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
