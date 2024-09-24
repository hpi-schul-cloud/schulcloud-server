import { faker } from '@faker-js/faker';
import { BadDataLoggableException } from './bad-data.loggable-exception';

describe('BadDataLoggableException', () => {
	describe('when creating a new instance', () => {
		const setup = () => {
			const message = faker.lorem.sentence();
			const details = { detail: faker.lorem.sentence() };
			const exception = new BadDataLoggableException(message, details);

			return {
				message,
				details,
				exception,
			};
		};

		it('should set the code', () => {
			const { exception } = setup();

			expect(exception.code).toEqual(400);
		});

		it('should set type', () => {
			const { exception } = setup();

			expect(exception.type).toEqual('BAD_DATA');
		});

		it('should set the message', () => {
			const { message, exception } = setup();

			expect(exception.message).toEqual(message);
		});

		it('should set details', () => {
			const { details, exception } = setup();

			expect(exception.details).toEqual(details);
		});

		it('should implement Loggable', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toBeDefined();
		});
	});
});
