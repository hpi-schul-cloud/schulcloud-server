import { TspAccessTokenLoggableError } from './tsp-access-token.loggable-error';

describe(TspAccessTokenLoggableError.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const error = new Error('error message');

			const expected = {
				type: 'TSP_ACCESS_TOKEN_ERROR',
				message: 'The TSP access token could not be generated during the sync',
				stack: expect.any(String),
				error,
			};

			return { expected, error };
		};

		it('should return a log message', () => {
			const { expected, error } = setup();

			const loggable = new TspAccessTokenLoggableError(error);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
