import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType } from '../domain';
import { BoardNodeCopyFailedLoggableException } from './board-node-copy-failed.loggable-exception';

describe(BoardNodeCopyFailedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const boardNodeId = new ObjectId().toHexString();
			const error = new Error('RPC timeout');

			const exception = new BoardNodeCopyFailedLoggableException(boardNodeId, BoardNodeType.FILE_ELEMENT, error);

			return { exception, boardNodeId, error };
		};

		it('should return the correct log message', () => {
			const { exception, boardNodeId, error } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'BOARD_NODE_COPY_FAILED',
				error,
				stack: expect.any(String),
				data: {
					boardNodeId,
					boardNodeType: BoardNodeType.FILE_ELEMENT,
				},
			});
		});

		describe('when the cause is not an Error', () => {
			it('should wrap the cause into an Error', () => {
				const exception = new BoardNodeCopyFailedLoggableException('id', BoardNodeType.CARD, { code: 'x' });

				const message = exception.getLogMessage();

				expect(message).toEqual(expect.objectContaining({ error: new Error(JSON.stringify({ code: 'x' })) }));
			});
		});
	});
});
