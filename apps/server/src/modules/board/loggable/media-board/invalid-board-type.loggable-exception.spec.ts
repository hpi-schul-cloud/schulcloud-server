import { MediaBoard } from '../../domain';
import { InvalidBoardTypeLoggableException } from './invalid-board-type.loggable-exception';

describe(InvalidBoardTypeLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const mediaBoardId = 'mediaBoardId';

			const loggable = new InvalidBoardTypeLoggableException(MediaBoard, mediaBoardId);

			return {
				loggable,
				mediaBoardId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, mediaBoardId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_BOARD_TYPE',
				message: 'Board does not have the expected type',
				stack: loggable.stack,
				data: {
					mediaBoardId,
					expectedType: MediaBoard.name,
				},
			});
		});
	});
});
