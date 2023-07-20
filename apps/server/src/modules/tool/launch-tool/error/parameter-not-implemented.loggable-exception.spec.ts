import { CustomParameterType } from '@shared/domain';
import { ParameterNotImplementedLoggableException } from './parameter-not-implemented.loggable-exception';

describe('ParameterNotImplementedLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new ParameterNotImplementedLoggableException(CustomParameterType.AUTO_SCHOOLID);

			return {
				exception,
			};
		};

		it('should log the correct message', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'PARAMETER_NOT_IMPLEMENTED',
				message: expect.any(String),
				stack: expect.any(String),
				data: {
					parameterType: CustomParameterType.AUTO_SCHOOLID,
				},
			});
		});
	});
});
