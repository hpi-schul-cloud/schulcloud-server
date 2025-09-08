import { ToolConfigType } from '../../../common/enum';
import { InvalidToolTypeLoggableException } from './invalid-tool-type.loggable-exception';

describe(InvalidToolTypeLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const expected = ToolConfigType.LTI11;
			const received = ToolConfigType.OAUTH2;

			const loggable = new InvalidToolTypeLoggableException(expected, received);

			return {
				loggable,
				expected,
				received,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, expected, received } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_TOOL_TYPE',
				message: 'The external tool has the wrong tool type.',
				stack: loggable.stack,
				data: {
					expected,
					received,
				},
			});
		});
	});
});
