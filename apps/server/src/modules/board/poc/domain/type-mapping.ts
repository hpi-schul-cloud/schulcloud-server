import type { AnyBoardNode } from './types/any-board-node';
import { BoardNodeType } from './types/board-node-type.enum';
import { Card } from './card.do';
import { CollaborativeTextEditor } from './collaborative-text-editor.do';
import { Column } from './column.do';
import { ColumnBoard } from './colum-board.do';
import { DrawingElement } from './drawing-element.do';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { LinkElement } from './link-element.do';
import { MediaBoard, MediaExternalToolElement, MediaLine } from './media-board';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import { SubmissionItem } from './submission-item.do';

// register node types
const BoardNodeTypeToConstructor = {
	[BoardNodeType.CARD]: Card,
	[BoardNodeType.COLLABORATIVE_TEXT_EDITOR]: CollaborativeTextEditor,
	[BoardNodeType.COLUMN]: Column,
	[BoardNodeType.COLUMN_BOARD]: ColumnBoard,
	[BoardNodeType.DRAWING_ELEMENT]: DrawingElement,
	[BoardNodeType.EXTERNAL_TOOL]: ExternalToolElement,
	[BoardNodeType.FILE_ELEMENT]: FileElement,
	[BoardNodeType.LINK_ELEMENT]: LinkElement,
	[BoardNodeType.MEDIA_BOARD]: MediaBoard,
	[BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT]: MediaExternalToolElement,
	[BoardNodeType.MEDIA_LINE]: MediaLine,
	[BoardNodeType.RICH_TEXT_ELEMENT]: RichTextElement,
	[BoardNodeType.SUBMISSION_CONTAINER_ELEMENT]: SubmissionContainerElement,
	[BoardNodeType.SUBMISSION_ITEM]: SubmissionItem,
} as const;

export const getBoardNodeConstructor = <T extends BoardNodeType>(type: T): typeof BoardNodeTypeToConstructor[T] =>
	BoardNodeTypeToConstructor[type];

export const getBoardNodeType = <T extends AnyBoardNode>(boardNode: T): BoardNodeType => {
	const type = Object.keys(BoardNodeTypeToConstructor).find((key) => {
		const Constructor = BoardNodeTypeToConstructor[key as BoardNodeType];
		return boardNode instanceof Constructor;
	});
	if (type === undefined) {
		throw new Error();
	}
	return type as BoardNodeType;
};
