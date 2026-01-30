import { ErrorLogMessage } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { H5pEditorContentInvalidIdLoggableException } from './h5p-editor-content-invalid-id.loggable-exception';

describe(H5pEditorContentInvalidIdLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contentId = new ObjectId().toHexString();

			const loggable = new H5pEditorContentInvalidIdLoggableException(contentId);

			return {
				loggable,
				contentId,
			};
		};

		it('should return the correct loggable message', () => {
			const { loggable, contentId } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'H5P_EDITOR_CONTENT_INVALID_ID',
				stack: loggable.stack,
				data: {
					contentId,
				},
			});
		});
	});
});
