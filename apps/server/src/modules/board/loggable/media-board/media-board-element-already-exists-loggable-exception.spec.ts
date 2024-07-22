import { MediaBoardElementAlreadyExistsLoggableException } from './media-board-element-already-exists-loggable-exception';

describe('MediaBoardElementAlreadyExistsLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaBoardId = 'mediaBoardId';
			const schoolExternalToolId = 'schoolExternalToolId';
			const loggable = new MediaBoardElementAlreadyExistsLoggableException(mediaBoardId, schoolExternalToolId);

			return { loggable, mediaBoardId, schoolExternalToolId };
		};

		it('should return a loggable message', () => {
			const { loggable, mediaBoardId, schoolExternalToolId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'MEDIA_BOARD_ELEMENT_ALREADY_EXISTS',
				message: 'Media element already exists on media board',
				stack: loggable.stack,
				data: {
					mediaBoardId,
					schoolExternalToolId,
				},
			});
		});
	});
});
