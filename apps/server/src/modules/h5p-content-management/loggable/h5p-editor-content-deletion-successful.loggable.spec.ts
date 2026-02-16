import { ObjectId } from '@mikro-orm/mongodb';
import { H5pEditorContentDeletionSuccessfulLoggable } from './h5p-editor-content-deletion-successful.loggable';

describe(H5pEditorContentDeletionSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const contentId = new ObjectId().toHexString();

			const loggable = new H5pEditorContentDeletionSuccessfulLoggable(contentId);

			return {
				loggable,
				contentId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, contentId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Content successfully deleted',
				data: {
					contentId,
				},
			});
		});
	});
});
