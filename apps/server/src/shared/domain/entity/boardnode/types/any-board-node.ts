import {
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	FileElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from '@shared/domain';

export type AnyElementNode = FileElementNode | RichTextElementNode | SubmissionContainerElementNode;
export type AnyBoardNode = ColumnBoardNode | ColumnNode | CardNode | AnyElementNode | SubmissionItemNode;
