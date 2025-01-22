import { TspAccessTokenLoggableError } from './tsp-access-token.loggable-error';

describe(TspAccessTokenLoggableError.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const expected = {
				type: 'TSP_ACCESS_TOKEN_ERROR',
				message: 'The TSP access token could not be generated during the sync',
				stack: expect.any(String),
			};

			return { expected };
		};

		it('should return a log message', () => {
			const { expected } = setup();

			const loggable = new TspAccessTokenLoggableError();

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
