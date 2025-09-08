import { ObjectId } from '@mikro-orm/mongodb';
import { UUID } from 'bson';
import { LtiDeepLinkTokenMissingLoggableException } from './lti-deep-link-token-missing.loggable-exception';

describe(LtiDeepLinkTokenMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const state = new UUID().toString();
			const contextExternalToolId = new ObjectId().toHexString();

			const loggable = new LtiDeepLinkTokenMissingLoggableException(state, contextExternalToolId);

			return {
				loggable,
				state,
				contextExternalToolId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, state, contextExternalToolId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'UNAUTHORIZED_EXCEPTION',
				message: 'Unable to find lti deep link token for this state. It might have expired.',
				stack: loggable.stack,
				data: {
					state,
					contextExternalToolId,
				},
			});
		});
	});
});
