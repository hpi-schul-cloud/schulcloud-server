import type { Card } from '../card.do';
import type { Column } from '../column.do';
import type { ColumnBoard } from '../colum-board.do';
import type { SubmissionItem } from '../submission-item.do';
import type { CollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import type { AnyContentElement } from './any-content-element';
import type { AnyMediaBoardNode } from '../media-board/types/any-media-board-node';

export type AnyBoardNode =
	| AnyContentElement
	| AnyMediaBoardNode
	| Card
	| CollaborativeTextEditorElement
	| Column
	| ColumnBoard
	| SubmissionItem;
