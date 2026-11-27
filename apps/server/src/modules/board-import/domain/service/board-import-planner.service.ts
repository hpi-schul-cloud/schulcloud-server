import { Injectable } from '@nestjs/common';
import { encode } from 'html-entities';
import { sanitizeRichText } from '@shared/controller/transformer';
import {
	BOARD_PLAN_VERSION,
	type BoardImportInstanceFeatures,
	type BoardImportNote,
	BoardImportNoteType,
	type BoardPlan,
	type IntermediateBoard,
	type IntermediateCard,
	type IntermediateElement,
	IntermediateElementType,
	type IntermediateSection,
	type PlannedCard,
	type PlannedColumn,
	type PlannedElement,
	PlannedElementType,
} from '../type';

// The limit of the board API for the title of a board.
export const BOARD_TITLE_MAX_LENGTH = 100;
export const BOARD_TITLE_FALLBACK = 'Import';

const LINE_BREAKS = /\s*[\r\n]+\s*/g;
const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export interface BoardImportPlanResult {
	plan: BoardPlan;
	notes: BoardImportNote[];
}

interface PlanContext {
	features: BoardImportInstanceFeatures;
	notes: BoardImportNote[];
}

interface NotePlace {
	sectionTitle: string;
	cardTitle: string;
}

// Converts the intermediate model to the board plan. See ADR 0015.
@Injectable()
export class BoardImportPlannerService {
	public plan(board: IntermediateBoard, features: BoardImportInstanceFeatures): BoardImportPlanResult {
		const notes: BoardImportNote[] = [];
		const title = this.planBoardTitle(board.title, notes);
		if (board.description.trim() !== '') {
			notes.push({ type: BoardImportNoteType.BOARD_DESCRIPTION_LEFT_OUT });
		}
		const context: PlanContext = { features, notes };
		const columns = board.sections.map((section) => this.planColumn(section, context));
		const plan: BoardPlan = { version: BOARD_PLAN_VERSION, title, columns };

		return { plan, notes };
	}

	private planBoardTitle(sourceTitle: string, notes: BoardImportNote[]): string {
		const title = this.toSingleLine(sourceTitle);
		// The board API removes HTML from the title and rejects a title that is empty after that.
		if (sanitizeRichText(title).trim() === '') {
			return BOARD_TITLE_FALLBACK;
		}
		// The board API counts a surrogate pair as one character.
		const characters = Array.from(title);
		if (characters.length <= BOARD_TITLE_MAX_LENGTH) {
			return title;
		}

		notes.push({ type: BoardImportNoteType.BOARD_TITLE_SHORTENED });
		const shortTitle = characters.slice(0, BOARD_TITLE_MAX_LENGTH).join('').trimEnd();

		return shortTitle;
	}

	private planColumn(section: IntermediateSection, context: PlanContext): PlannedColumn {
		const title = this.toSingleLine(section.title);
		const cards = section.cards
			.map((card) => this.planCard(card, title, context))
			.filter((card) => card.title !== '' || card.elements.length > 0);
		const column: PlannedColumn = { title, cards };

		return column;
	}

	private planCard(card: IntermediateCard, sectionTitle: string, context: PlanContext): PlannedCard {
		const title = this.toSingleLine(card.title);
		const place: NotePlace = { sectionTitle, cardTitle: title };
		const elements = card.elements.flatMap((element) => this.planElement(element, place, context));
		const plannedCard: PlannedCard = { title, elements };

		return plannedCard;
	}

	private planElement(element: IntermediateElement, place: NotePlace, context: PlanContext): PlannedElement[] {
		if (element.type === IntermediateElementType.TEXT) {
			return [{ type: PlannedElementType.TEXT, html: element.html }];
		}

		const url = element.type === IntermediateElementType.LINK ? this.toLinkUrl(element.url) : undefined;
		if (url !== undefined) {
			return [this.planLink(url, place, context)];
		}

		const note: BoardImportNote = { type: BoardImportNoteType.ELEMENT_LEFT_OUT, ...place, elementType: element.type };
		if (element.type === IntermediateElementType.NOT_SUPPORTED) {
			note.elementKind = element.kind;
		}
		context.notes.push(note);

		return [];
	}

	private planLink(url: string, place: NotePlace, context: PlanContext): PlannedElement {
		if (context.features.linkElementEnabled) {
			return { type: PlannedElementType.LINK, url };
		}

		context.notes.push({ type: BoardImportNoteType.LINK_CREATED_AS_TEXT, ...place });
		const text = encode(url);

		return { type: PlannedElementType.TEXT, html: `<p><a href="${text}">${text}</a></p>` };
	}

	// Gives the normalized URL, or undefined when the board must not get the link.
	// An address without a protocol gets https, as in the link element of the client.
	private toLinkUrl(sourceUrl: string): string | undefined {
		const trimmedUrl = sourceUrl.trim();
		const hasProtocol = trimmedUrl.includes('://') || /^mailto:/i.test(trimmedUrl);
		const completeUrl = hasProtocol ? trimmedUrl : `https://${trimmedUrl}`;
		if (!URL.canParse(completeUrl)) {
			return undefined;
		}

		const url = new URL(completeUrl);
		if (!LINK_PROTOCOLS.has(url.protocol)) {
			return undefined;
		}

		return url.toString();
	}

	private toSingleLine(text: string): string {
		const singleLine = text.replace(LINE_BREAKS, ' ').trim();

		return singleLine;
	}
}
