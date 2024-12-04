import { LtiMessageTypeNotImplementedLoggableException } from './lti-message-type-not-implemented.loggable-exception';

describe(LtiMessageTypeNotImplementedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const unknownMessageType = 'unknownMessageType';

			const loggable = new LtiMessageTypeNotImplementedLoggableException(unknownMessageType);

			return {
				loggable,
				unknownMessageType,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, unknownMessageType } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'LTI_MESSAGE_TYPE_NOT_IMPLEMENTED',
				message: 'The lti message type is not implemented.',
				stack: loggable.stack,
				data: {
					lti_message_type: unknownMessageType,
				},
			});
		});
	});
});
