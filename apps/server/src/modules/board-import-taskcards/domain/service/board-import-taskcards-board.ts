import {
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	type BoardImportSource,
	type IntermediateBoard,
	type IntermediateCard,
	type IntermediateElement,
	IntermediateElementType,
	type IntermediateSection,
} from '@modules/board-import';
import { isJsonObject, type JsonObject } from './taskcards-json';

const PINBOARD_TYPE = 0;
const NO_VIDEO_CONFERENCE = 'None';
const SIZE_PATTERN = /^\d+$/;
export const TASKCARDS_SECTION_TITLE_FOR_CARDS_WITHOUT_LIST = 'Ohne Spalte';

export const TASKCARDS_NOT_SUPPORTED_KIND_CONTACT = 'contact';

const toText = (value: unknown): string => (typeof value === 'string' ? value : '');

const toOptionalText = (value: unknown): string | undefined =>
	typeof value === 'string' && value !== '' ? value : undefined;

const toPosition = (value: unknown): number => (typeof value === 'number' ? value : 0);

const toObjects = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isJsonObject) : []);

const byPosition = <T extends { position: number }>(a: T, b: T): number => a.position - b.position;

// The source gives the size as text.
const toSize = (value: unknown): number | undefined => {
	const size = typeof value === 'string' && SIZE_PATTERN.test(value) ? Number(value) : undefined;

	return size;
};

const mapAttachment = (attachment: JsonObject): IntermediateElement => {
	const element: IntermediateElement = {
		type: IntermediateElementType.FILE,
		name: toText(attachment.filename),
		url: toOptionalText(attachment.downloadLink),
		mimeType: toOptionalText(attachment.mimetype),
		sizeInBytes: toSize(attachment.length),
	};

	return element;
};

const mapElements = (card: JsonObject): IntermediateElement[] => {
	const elements: IntermediateElement[] = [];
	const videoConference = toText(card.videoConference);
	const description = toText(card.description);
	const link = toText(card.link).trim();

	if (videoConference !== '' && videoConference !== NO_VIDEO_CONFERENCE) {
		elements.push({ type: IntermediateElementType.VIDEO_CONFERENCE });
	}
	if (description.trim() !== '') {
		elements.push({ type: IntermediateElementType.TEXT, html: description });
	}
	if (link !== '') {
		elements.push({ type: IntermediateElementType.LINK, url: link });
	}
	elements.push(...toObjects(card.attachments).map(mapAttachment));
	if (card.enableContract === true) {
		elements.push({ type: IntermediateElementType.NOT_SUPPORTED, kind: TASKCARDS_NOT_SUPPORTED_KIND_CONTACT });
	}

	return elements;
};

const mapCard = (card: JsonObject): IntermediateCard => {
	const mappedCard: IntermediateCard = {
		title: toText(card.title),
		color: toOptionalText(card.color),
		elements: mapElements(card),
	};

	return mappedCard;
};

const mapSections = (board: JsonObject): IntermediateSection[] => {
	const lists = toObjects(board.lists)
		.map((list) => {
			return { id: toText(list.id), position: toPosition(list.position), list };
		})
		.sort(byPosition);
	const cards = toObjects(board.cards)
		.map((card) => {
			const kanbanPosition = isJsonObject(card.kanbanPosition) ? card.kanbanPosition : {};

			return { listId: toText(kanbanPosition.listId), position: toPosition(kanbanPosition.position), card };
		})
		.sort(byPosition);

	const cardsByListId = new Map<string, IntermediateCard[]>();
	for (const { id } of lists) {
		if (id !== '') {
			cardsByListId.set(id, []);
		}
	}
	const cardsWithoutList: IntermediateCard[] = [];
	for (const { listId, card } of cards) {
		const cardsOfList = cardsByListId.get(listId) ?? cardsWithoutList;
		cardsOfList.push(mapCard(card));
	}

	// The delete gives the cards of a list id that is used twice only to the first list.
	const sections = lists.map(({ id, list }): IntermediateSection => {
		const cardsOfList = cardsByListId.get(id) ?? [];
		cardsByListId.delete(id);
		const section: IntermediateSection = {
			title: toText(list.name),
			color: toOptionalText(list.color),
			cards: cardsOfList,
		};

		return section;
	});
	if (cardsWithoutList.length > 0) {
		sections.push({ title: TASKCARDS_SECTION_TITLE_FOR_CARDS_WITHOUT_LIST, cards: cardsWithoutList });
	}

	return sections;
};

// Rejects with BoardImportJobRejectedError when the board is not a pinboard. ADR 0015 says what a source maps.
export const mapTaskcardsBoard = (board: JsonObject, source: BoardImportSource): IntermediateBoard => {
	if (board.type !== PINBOARD_TYPE) {
		throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_BOARD_TYPE_NOT_SUPPORTED);
	}

	const intermediateBoard: IntermediateBoard = {
		version: 1,
		source: { ...source },
		title: toText(board.name),
		description: toText(board.description),
		sections: mapSections(board),
	};

	return intermediateBoard;
};
