import { InstanceNotIdentifiableLoggableException } from './instance-not-identifiable-loggable-exception';

describe(InstanceNotIdentifiableLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new InstanceNotIdentifiableLoggableException();

			return {
				exception,
			};
		};

		it('should log the correct message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'INTERNAL_SERVER_ERROR',
				stack: expect.any(String),
				message: 'Instance could not be identified.',
			});
		});
	});
});
