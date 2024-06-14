import { getBoardNodeType, handleNonExhaustiveSwitch } from './type-mapping';

import { BoardNodeType } from './types/board-node-type.enum';

import {
	cardFactory,
	collaborativeTextEditorFactory,
	columnFactory,
	columnBoardFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '../testing';

describe('getBoardNodeType', () => {
	it('should return correct type for each instance', () => {
		expect(getBoardNodeType(cardFactory.build())).toBe(BoardNodeType.CARD);
		expect(getBoardNodeType(collaborativeTextEditorFactory.build())).toBe(BoardNodeType.COLLABORATIVE_TEXT_EDITOR);
		expect(getBoardNodeType(columnFactory.build())).toBe(BoardNodeType.COLUMN);
		expect(getBoardNodeType(columnBoardFactory.build())).toBe(BoardNodeType.COLUMN_BOARD);
		expect(getBoardNodeType(drawingElementFactory.build())).toBe(BoardNodeType.DRAWING_ELEMENT);
		expect(getBoardNodeType(externalToolElementFactory.build())).toBe(BoardNodeType.EXTERNAL_TOOL);
		expect(getBoardNodeType(fileElementFactory.build())).toBe(BoardNodeType.FILE_ELEMENT);
		expect(getBoardNodeType(linkElementFactory.build())).toBe(BoardNodeType.LINK_ELEMENT);
		expect(getBoardNodeType(mediaBoardFactory.build())).toBe(BoardNodeType.MEDIA_BOARD);
		expect(getBoardNodeType(mediaExternalToolElementFactory.build())).toBe(BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT);
		expect(getBoardNodeType(mediaLineFactory.build())).toBe(BoardNodeType.MEDIA_LINE);
		expect(getBoardNodeType(richTextElementFactory.build())).toBe(BoardNodeType.RICH_TEXT_ELEMENT);
		expect(getBoardNodeType(submissionContainerElementFactory.build())).toBe(
			BoardNodeType.SUBMISSION_CONTAINER_ELEMENT
		);
		expect(getBoardNodeType(submissionItemFactory.build())).toBe(BoardNodeType.SUBMISSION_ITEM);
	});

	it('should throw error for unknown type', () => {
		class UnknownType {}
		expect(() => getBoardNodeType(new UnknownType() as any)).toThrow();
	});
});

describe('handleNonExhaustiveSwitch', () => {
	it('should throw error', () => {
		expect(() => handleNonExhaustiveSwitch('unknown' as never)).toThrow();
	});
});
