// A job stores its board plan. A change of the plan that a stored plan does not fit needs a new version.
export const BOARD_PLAN_VERSION = 1;

export enum PlannedElementType {
	TEXT = 'text',
}

interface PlannedTextElement {
	type: PlannedElementType.TEXT;
	// The server sanitizes the HTML when it stores the element.
	html: string;
}

export type PlannedElement = PlannedTextElement;

export interface PlannedCard {
	title: string;
	elements: PlannedElement[];
}

export interface PlannedColumn {
	title: string;
	cards: PlannedCard[];
}

// The board that the import creates. It contains only content that the API of the board accepts.
export interface BoardPlan {
	version: number;
	title: string;
	columns: PlannedColumn[];
}
