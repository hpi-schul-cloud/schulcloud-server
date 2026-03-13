import { LogMessage } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { H5pEditorContentCopySuccessfulLoggable } from './h5p-editor-content-copy-successful.loggable';

describe(H5pEditorContentCopySuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const sourceContentId = new ObjectId().toHexString();
			const copiedContentId = new ObjectId().toHexString();

			const loggable = new H5pEditorContentCopySuccessfulLoggable(sourceContentId, copiedContentId);

			return {
				loggable,
				sourceContentId,
				copiedContentId,
			};
		};

		it('should return the correct loggable message', () => {
			const { loggable, sourceContentId, copiedContentId } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual<LogMessage>({
				message: 'Content successfully copied',
				data: {
					sourceContentId,
					copiedContentId,
				},
			});
		});
	});
});
