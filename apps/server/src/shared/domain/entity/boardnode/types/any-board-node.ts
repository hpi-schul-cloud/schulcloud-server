import {
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	ExternalToolElement,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from '@shared/domain';

export type AnyElementNode =
	| FileElementNode
	| RichTextElementNode
	| SubmissionContainerElementNode
	| ExternalToolElement
	| LinkElementNode;

export type AnyBoardNode = ColumnBoardNode | ColumnNode | CardNode | AnyElementNode | SubmissionItemNode;
