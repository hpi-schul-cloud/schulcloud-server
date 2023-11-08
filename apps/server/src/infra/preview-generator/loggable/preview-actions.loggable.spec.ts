import { PreviewActionsLoggable } from './preview-actions.loggable';

describe('PreviewActionsLoggable', () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const message = 'message';
			const payload = {
				originFilePath: 'originFilePath',
				previewFilePath: 'previewFilePath',
				previewOptions: {
					format: 'webp',
					width: 100,
				},
			};

			const expectedResponse = {
				message,
				data: {
					originFilePath: payload.originFilePath,
					previewFilePath: payload.previewFilePath,
					format: payload.previewOptions.format,
					width: payload.previewOptions.width,
				},
			};

			return { message, payload, expectedResponse };
		};

		it('should return log message', () => {
			const { message, payload, expectedResponse } = setup();

			const result = new PreviewActionsLoggable(message, payload).getLogMessage();

			expect(result).toEqual(expectedResponse);
		});
	});
});
