import { chunk } from 'lodash';
import { InputFormat } from '@shared/domain/types';
import { io } from 'socket.io-client';
import {
	AnyContentElementResponse,
	BoardResponse,
	CardResponse,
	ColumnResponse,
	LinkContentBody,
} from '../controller/dto';
import { ContentElementType } from '../domain';
import {
	CreateCardMessageParams,
	CreateContentElementMessageParams,
	DeleteCardMessageParams,
	DeleteColumnMessageParams,
	DeleteContentElementMessageParams,
	FetchCardsMessageParams,
	UpdateCardTitleMessageParams,
	UpdateColumnTitleMessageParams,
	UpdateContentElementMessageParams,
} from '../gateway/dto';

let columns: Array<ColumnResponse> = [];

async function sleep(ms: number) {
	// eslint-disable-next-line no-promise-executor-return
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createLoadtestClient(baseUrl: string, boardId: string, token: string) {
	const cards: Array<CardResponse> = [];
	const socket = io(baseUrl, {
		path: '/board-collaboration',
		extraHeaders: {
			cookie: ` 'USER_TIMEZONE=Europe/Berlin; jwt=${token}`,
		},
	});

	const getCardPosition = (cardId: string) => cards.findIndex((card) => card.id === cardId);

	const getColumnPosition = (columnId) => columns.findIndex((column) => column.id === columnId);

	const emitOnSocket = (action, data) => {
		if (!socket.connected) {
			socket.connect();
		}
		socket.emit(action, data);
	};

	const waitForSuccess = async (eventName: string, options?: { checkIsOwnAction?: boolean; timeoutMs?: number }) =>
		new Promise((resolve, reject) => {
			const { checkIsOwnAction, timeoutMs } = { checkIsOwnAction: true, timeoutMs: 500000, ...options };
			const timeoutId = setTimeout(() => {
				reject(new Error(`Timeout waiting for ${eventName}`));
			}, timeoutMs);
			const listener = (data: { isOwnAction: boolean }) => {
				if (checkIsOwnAction === true && data.isOwnAction === false) {
					return;
				}

				clearTimeout(timeoutId);
				resolve(data);
				socket.off(eventName, listener);
			};
			socket.on(eventName, listener);
		});

	const responseTimes: Array<{ action: string; responseTime: number }> = [];
	const logResponseTime = (action: string, responseTime: number) => {
		responseTimes.push({ action, responseTime });
	};

	const emitAndWait = async (actionPrefix: string, data: unknown) => {
		const startTime = performance.now();
		emitOnSocket(`${actionPrefix}-request`, data);
		const result = await waitForSuccess(`${actionPrefix}-success`);
		const responseTime = performance.now() - startTime;
		logResponseTime(actionPrefix, responseTime);
		return result;
	};

	const fetchBoard = async () => {
		const result = (await emitAndWait('fetch-board', { boardId })) as BoardResponse;
		if (result.columns.length >= columns.length) {
			columns = result.columns;
		}
		return result;
	};

	const fetchCard = async (payload: FetchCardsMessageParams) => {
		const { newCard } = (await emitAndWait('fetch-card', payload)) as { newCard: CardResponse };
		return newCard;
	};

	socket.on('connect', async () => {
		console.log('connected');
		await fetchBoard();
	});

	socket.on('disconnect', () => {
		console.log('disconnected');
	});

	socket.onAny(
		(event: string, payload: { isOwnAction: boolean; newCard?: CardResponse; newColumn?: ColumnResponse }) => {
			if (event === 'create-card-success' && payload.newCard) {
				cards.push(payload.newCard);
				fetchCard({ cardIds: [payload.newCard.id] }).catch(console.error);
			}
			if (event === 'create-column-success' && payload.newColumn) {
				columns.push(payload.newColumn);
			}
		}
	);

	const createColumn = async () => {
		const { newColumn } = (await emitAndWait('create-column', { boardId })) as { newColumn: ColumnResponse };
		return newColumn;
	};

	const createCard = async (payload: CreateCardMessageParams) => {
		const { newCard } = (await emitAndWait('create-card', payload)) as { newCard: CardResponse };
		return newCard;
	};

	const deleteColumn = async (payload: DeleteColumnMessageParams) => {
		const result = (await emitAndWait('delete-column', payload)) as { columnId: string };
		return result;
	};

	const deleteCard = async (payload: DeleteCardMessageParams) => {
		const result = (await emitAndWait('delete-Card', payload)) as { cardId: string };
		return result;
	};

	const deleteElement = async (payload: DeleteContentElementMessageParams) => {
		const result = (await emitAndWait('delete-element', payload)) as { elementId: string };
		return result;
	};

	const deleteAllColumns = async () => {
		const deletePromises = columns.map((column) => deleteColumn({ columnId: column.id }));
		await Promise.all(deletePromises);
		columns = [];
	};

	const createElement = async (payload: CreateContentElementMessageParams) => {
		const { newElement } = (await emitAndWait('create-element', payload)) as { newElement: AnyContentElementResponse };
		return newElement;
	};

	const moveCard = async (columnId: string, cardId: string, oldIndex: number, newIndex: number) => {
		const result = await emitAndWait('move-card', {
			cardId,
			oldIndex,
			newIndex,
			fromColumnIndex: getColumnPosition(columnId),
			toColumnIndex: getColumnPosition(columnId),
			fromColumnId: columnId,
			toColumnId: columnId,
		});
		return result;
	};

	const moveColumn = async (columnId: string, removedIndex: number, addedIndex: number) => {
		const result = await emitAndWait('move-column', {
			columnMove: { addedIndex, removedIndex, columnId },
			targetBoardId: boardId,
			byKeyboard: false,
		});
		return result;
	};

	const updateColumnTitle = async (payload: UpdateColumnTitleMessageParams) => {
		const result = await emitAndWait('update-column-title', payload);
		return result;
	};

	const updateCardTitle = async (payload: UpdateCardTitleMessageParams) => {
		const result = await emitAndWait('update-card-title', payload);
		return result;
	};

	const updateElement = async (payload: UpdateContentElementMessageParams) => {
		const result = await emitAndWait('update-element', payload);
		return result;
	};

	const createAndUpdateLinkElement = async (cardId: string, content: LinkContentBody) => {
		const element = await createElement({
			cardId,
			type: ContentElementType.LINK,
		});
		const result = await updateElement({
			elementId: element.id,
			data: { type: ContentElementType.LINK, content },
		});
		return result;
	};

	const createAndUpdateTextElement = async (cardId: string, text: string) => {
		const element = await createElement({
			cardId,
			type: ContentElementType.RICH_TEXT,
		});
		const textChunks = chunk(text.split(''), 20).map((c) => c.join(''));
		let result;
		let currentText = '';
		for (const textChunk of textChunks) {
			currentText += textChunk;
			// eslint-disable-next-line no-await-in-loop
			result = await updateElement({
				elementId: element.id,
				data: {
					type: ContentElementType.RICH_TEXT,
					content: {
						inputFormat: InputFormat.RICH_TEXT_CK5,
						text: `<p>${currentText}</p>`,
					},
				},
			});

			// eslint-disable-next-line no-await-in-loop
			await sleep(200);
		}
		return result as UpdateContentElementMessageParams;
	};

	const getResponseTimes = () => responseTimes;

	return {
		createColumn,
		createCard,
		createElement,
		createAndUpdateLinkElement,
		createAndUpdateTextElement,
		deleteColumn,
		deleteCard,
		deleteElement,
		deleteAllColumns,
		fetchBoard,
		fetchCard,
		moveColumn,
		moveCard,
		updateColumnTitle,
		updateCardTitle,
		updateElement,
		emitOnSocket,
		getResponseTimes,
		waitForSuccess,
		getCardPosition,
		getColumnPosition,
	};
}
