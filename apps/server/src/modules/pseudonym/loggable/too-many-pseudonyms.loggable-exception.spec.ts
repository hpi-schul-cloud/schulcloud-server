import { TooManyPseudonymsLoggableException } from './too-many-pseudonyms.loggable-exception';

describe('TooManyPseudonymsLoggableException', () => {
	describe('constructor', () => {
		const setup = () => {
			const pseudonym = 'pseudonym';

			return { pseudonym };
		};

		it('should create an instance of TooManyPseudonymsLoggableException', () => {
			const { pseudonym } = setup();

			const loggable = new TooManyPseudonymsLoggableException(pseudonym);

			expect(loggable).toBeInstanceOf(TooManyPseudonymsLoggableException);
		});
	});

	describe('getLogMessage', () => {
		const setup = () => {
			const pseudonym = 'pseudonym';
			const loggable = new TooManyPseudonymsLoggableException(pseudonym);

			return { loggable, pseudonym };
		};

		it('should return a loggable message', () => {
			const { loggable, pseudonym } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'PSEUDONYMS_TOO_MANY_PSEUDONYMS_FOUND',
				message: 'Too many pseudonyms where found.',
				stack: loggable.stack,
				data: {
					pseudonym,
				},
			});
		});
	});
});
