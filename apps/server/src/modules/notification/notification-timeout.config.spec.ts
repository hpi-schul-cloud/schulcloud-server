import { NotificationTimeoutConfig, NOTIFICATION_TIMEOUT_CONFIG_TOKEN } from './notification-timeout.config';

describe(NotificationTimeoutConfig.name, () => {
	describe('SSE_TIMEOUT', () => {
		it('should have default value of 24 hours', () => {
			const config = new NotificationTimeoutConfig();

			expect(config.SSE_TIMEOUT).toBe(1000 * 60 * 60 * 24);
		});
	});

	describe('NOTIFICATION_TIMEOUT_CONFIG_TOKEN', () => {
		it('should be defined', () => {
			expect(NOTIFICATION_TIMEOUT_CONFIG_TOKEN).toBe('NOTIFICATION_TIMEOUT_CONFIG_TOKEN');
		});
	});
});
