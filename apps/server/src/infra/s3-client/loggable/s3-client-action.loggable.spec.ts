import { S3ClientActionLoggable } from './s3-client-action.loggable';

describe('S3ClientActionLoggable', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getLogMessage', () => {
		describe('when getLogMessage resolves', () => {
			const setup = () => {
				const message = 'Test message';
				const payload = {
					action: 'upload',
					objectPath: ['/foo/bar.txt', '/baz/qux.txt'],
					bucket: 'test-bucket',
				};

				const loggable = new S3ClientActionLoggable(message, payload);

				return {
					message,
					payload,
					loggable,
				};
			};

			it('should return the correct log message object', () => {
				const { message, payload, loggable } = setup();

				const result = loggable.getLogMessage();

				expect(result.message).toBe(message);
				expect(typeof result.data).toBe('object');
				if (typeof result.data === 'object' && result.data !== null) {
					expect(result.data.action).toBe(payload.action);
					expect(result.data.bucket).toBe(payload.bucket);
					expect(result.data.objectPath).toBe(JSON.stringify(payload.objectPath));
				} else {
					throw new Error('result.data is not an object');
				}
			});
		});
	});
});
