export enum BoardImportNoteType {
	BOARD_TITLE_SHORTENED = 'board-title-shortened',
	BOARD_DESCRIPTION_LEFT_OUT = 'board-description-left-out',
	ELEMENT_LEFT_OUT = 'element-left-out',
	LINK_CREATED_AS_TEXT = 'link-created-as-text',
}

// One content of the source that the board does not contain as the source has it.
// A note names the place with the titles of the source. It holds no other content of the source.
export interface BoardImportNote {
	type: BoardImportNoteType;
	sectionTitle?: string;
	cardTitle?: string;
	// The element type as the intermediate model names it. It is text, so that a note does not depend on a version
	// of the model.
	elementType?: string;
	// The kind of an element that the intermediate model has no type for.
	elementKind?: string;
}
