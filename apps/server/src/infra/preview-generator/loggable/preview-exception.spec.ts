import { InternalServerErrorException } from '@nestjs/common';
import { PreviewNotPossibleException } from './preview-exception';

describe(PreviewNotPossibleException.name, () => {
	describe('WHEN getLogMessage is called', () => {
		const setup = () => {
			const payload = {
				originFilePath: 'originFilePath',
				previewFilePath: 'previewFilePath',
				previewOptions: {
					format: 'format',
					width: 100,
				},
			};
			const error = new Error('error');

			return { payload, error };
		};

		it('should return error log message', () => {
			const { payload, error } = setup();

			const exception = new PreviewNotPossibleException(payload, error);

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: InternalServerErrorException.name,
				stack: exception.stack,
				error,
				data: {
					originFilePath: 'originFilePath',
					previewFilePath: 'previewFilePath',
					format: 'format',
					width: 100,
				},
			});
		});
	});
});
