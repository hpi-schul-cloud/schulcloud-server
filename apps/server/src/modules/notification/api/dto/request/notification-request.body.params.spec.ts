import { NotificationRequestBodyParams } from './notification-request.body.params';

describe(NotificationRequestBodyParams.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const notificationRequestBodyProps = new NotificationRequestBodyParams();

				return { deletionRequestBodyProps: notificationRequestBodyProps };
			};

			it('should be defined', () => {
				const { deletionRequestBodyProps: notificationRequestBodyProps } = setup();
				expect(notificationRequestBodyProps).toBeDefined();
			});
		});
	});
});
