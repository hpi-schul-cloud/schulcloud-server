import { type BoardImportSource } from './board-import-source';

// Increase the version with each change of the model that a reader of a stored model must know.
export const INTERMEDIATE_BOARD_VERSION = 1;

export enum IntermediateElementType {
	TEXT = 'text',
	LINK = 'link',
	FILE = 'file',
	VIDEO_CONFERENCE = 'video-conference',
	NOT_SUPPORTED = 'not-supported',
}

interface IntermediateTextElement {
	type: IntermediateElementType.TEXT;
	// HTML as the source gives it. It is not sanitized.
	html: string;
}

interface IntermediateLinkElement {
	type: IntermediateElementType.LINK;
	url: string;
}

// The model holds no file content. The URL points to the file in the source.
interface IntermediateFileElement {
	type: IntermediateElementType.FILE;
	name: string;
	url?: string;
	mimeType?: string;
	sizeInBytes?: number;
}

interface IntermediateVideoConferenceElement {
	type: IntermediateElementType.VIDEO_CONFERENCE;
}

// Content of the source that the model has no type for. The source decides the value of kind.
interface IntermediateNotSupportedElement {
	type: IntermediateElementType.NOT_SUPPORTED;
	kind: string;
}

export type IntermediateElement =
	| IntermediateTextElement
	| IntermediateLinkElement
	| IntermediateFileElement
	| IntermediateVideoConferenceElement
	| IntermediateNotSupportedElement;

export interface IntermediateCard {
	title: string;
	color?: string;
	elements: IntermediateElement[];
}

export interface IntermediateSection {
	title: string;
	color?: string;
	cards: IntermediateCard[];
}

// The content of a source board, without the limits and rules of the target board. The order of the sections,
// cards and elements is the order of the source.
export interface IntermediateBoard {
	version: number;
	source: BoardImportSource;
	title: string;
	description: string;
	sections: IntermediateSection[];
}
