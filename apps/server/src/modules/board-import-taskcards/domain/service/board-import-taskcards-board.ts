import {
	BoardImportJobLogReason,
	BoardImportJobRejectedError,
	type BoardImportSource,
	INTERMEDIATE_BOARD_VERSION,
	type IntermediateBoard,
	type IntermediateCard,
	type IntermediateElement,
	IntermediateElementType,
	type IntermediateSection,
} from '@modules/board-import';
import { isJsonObject, type JsonObject } from './taskcards-json';

const PINBOARD_TYPE = 0;
const NO_VIDEO_CONFERENCE = 'None';
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
	const size = typeof value === 'string' && value !== '' ? Number(value) : NaN;

	return Number.isFinite(size) ? size : undefined;
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
	const link = toText(card.link);

	if (videoConference !== '' && videoConference !== NO_VIDEO_CONFERENCE) {
		elements.push({ type: IntermediateElementType.VIDEO_CONFERENCE });
	}
	if (description.trim() !== '') {
		elements.push({ type: IntermediateElementType.TEXT, html: description });
	}
	if (link.trim() !== '') {
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

	const listIds = new Set(lists.map(({ id }) => id));
	const cardsByListId = new Map<string, IntermediateCard[]>();
	const cardsWithoutList: IntermediateCard[] = [];
	for (const { listId, card } of cards) {
		const cardsOfList = listIds.has(listId) ? (cardsByListId.get(listId) ?? []) : cardsWithoutList;
		cardsOfList.push(mapCard(card));
		cardsByListId.set(listId, cardsOfList);
	}

	const sections = lists.map(({ id, list }): IntermediateSection => {
		const section: IntermediateSection = {
			title: toText(list.name),
			color: toOptionalText(list.color),
			cards: cardsByListId.get(id) ?? [],
		};

		return section;
	});
	if (cardsWithoutList.length > 0) {
		sections.push({ title: TASKCARDS_SECTION_TITLE_FOR_CARDS_WITHOUT_LIST, cards: cardsWithoutList });
	}

	return sections;
};

// Maps the board of the board query to the intermediate model. It applies no limit and no rule of the target board.
// Rejects with BoardImportJobRejectedError when the board is not a pinboard.
export const mapTaskcardsBoard = (board: JsonObject, source: BoardImportSource): IntermediateBoard => {
	if (board.type !== PINBOARD_TYPE) {
		throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_BOARD_TYPE_NOT_SUPPORTED);
	}

	const intermediateBoard: IntermediateBoard = {
		version: INTERMEDIATE_BOARD_VERSION,
		source: { ...source },
		title: toText(board.name),
		description: toText(board.description),
		sections: mapSections(board),
	};

	return intermediateBoard;
};
