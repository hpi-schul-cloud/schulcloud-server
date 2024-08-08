/* eslint-disable no-await-in-loop */
import { chunk } from 'lodash';
import { performance } from 'perf_hooks';
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
	UpdateBoardTitleMessageParams,
	UpdateCardTitleMessageParams,
	UpdateColumnTitleMessageParams,
	UpdateContentElementMessageParams,
} from '../gateway/dto';
import { ResponseTimeRecord } from './types';

let columns: Array<ColumnResponse> = [];

async function sleep(ms: number) {
	// eslint-disable-next-line no-promise-executor-return
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let clientCount = 0;

export function createLoadtestClient(baseUrl: string, boardId: string, token: string) {
	const logs: Array<{ event: string; payload: { isOwnAction: boolean }; time: number }> = [];
	const cards: Array<CardResponse> = [];
	const socket = io(baseUrl, {
		path: '/board-collaboration',
		withCredentials: true,
		extraHeaders: {
			cookie: ` USER_TIMEZONE=Europe/Berlin; jwt=${token}`,
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

	// const waitForSuccessWithLoop = async (
	// 	eventName: string,
	// 	options: { timeoutMs?: number; startTime: number; event: unknown }
	// ): Promise<unknown> => {
	// 	const failureEventName = eventName.replace('success', 'failure');
	// 	const { timeoutMs, startTime } = { timeoutMs: 5000, ...options };
	// 	while (performance.now() <= startTime + timeoutMs) {
	// 		const ownEvents = logs
	// 			.filter((e) => e.payload.isOwnAction === true)
	// 			.filter((e) => e.event === eventName || e.event === failureEventName)
	// 			.filter((e) => e.time >= startTime);
	// 		if (ownEvents.length > 0) {
	// 			if (ownEvents[0].event === failureEventName) {
	// 				throw new Error(`Failure event ${failureEventName}`);
	// 			}
	// 			return ownEvents[0].payload;
	// 		}
	// 		await sleep(20);
	// 	}
	// 	throw new Error(`Timeout waiting for ${eventName}`);
	// };

	const mockIncommingEvent = (event: string, payload: { isOwnAction: boolean }) => {
		logs.push({ event, payload, time: performance.now() + 30 });
	};

	const waitForSuccess = async (
		successEventName: string,
		options?: { checkIsOwnAction?: boolean; timeoutMs?: number; event: unknown; startTime: number }
	) =>
		new Promise((resolve, reject) => {
			const failureEventName = successEventName.replace('success', 'failure');
			const { checkIsOwnAction, timeoutMs } = { checkIsOwnAction: true, timeoutMs: 15000, ...options };
			const timeoutId = setTimeout(() => {
				reject(new Error(`Timeout waiting for ${successEventName}`));
			}, timeoutMs);
			let listeners: { eventName: string; listener: (payload: { isOwnAction: boolean }) => void }[] = [];
			const removeListeners = () => {
				listeners.forEach(({ eventName, listener }) => socket.off(eventName, listener));
				listeners = [];
			};
			const successListener = (payload: { isOwnAction: boolean }) => {
				if (checkIsOwnAction === true && payload.isOwnAction === false) {
					return;
				}
				clearTimeout(timeoutId);
				removeListeners();
				resolve(payload);
			};
			const failureListener = (payload: { isOwnAction: boolean }) => {
				if (checkIsOwnAction === true && payload.isOwnAction === false) {
					return;
				}
				clearTimeout(timeoutId);
				removeListeners();
				reject(new Error(`Failure event ${failureEventName}`));
			};
			socket.on(successEventName, successListener);
			socket.on(failureEventName, failureListener);
			listeners.push({ eventName: successEventName, listener: successListener });
			listeners.push({ eventName: failureEventName, listener: failureListener });
		});

	const responseTimes: Array<ResponseTimeRecord> = [];
	const logResponseTime = (responseTime: ResponseTimeRecord) => {
		responseTimes.push(responseTime);
	};

	const emitAndWait = async (actionPrefix: string, data: unknown) => {
		const startTime = performance.now();
		const prepareWaitForSuccess = waitForSuccess(`${actionPrefix}-success`, {
			event: { name: `${actionPrefix}-request`, payload: data },
			startTime: performance.now(),
		});
		emitOnSocket(`${actionPrefix}-request`, data);
		const result = await prepareWaitForSuccess;
		const responseTime = performance.now() - startTime;
		logResponseTime({ action: actionPrefix, responseTime });
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

	const disconnect = () => {
		socket.disconnect();
	};

	socket.on('connect', () => {
		clientCount += 1;
		console.log(clientCount);
		// await sleep(100 + Math.ceil(Math.random() * 1000));
		// await fetchBoard();
	});

	socket.on('disconnect', () => {
		process.stdout.write('.');
	});

	socket.onAny(
		(event: string, payload: { isOwnAction: boolean; newCard?: CardResponse; newColumn?: ColumnResponse }) => {
			logs.push({ event, payload, time: performance.now() });
			if (event === 'create-card-success' && payload.newCard) {
				cards.push(payload.newCard);
				// fetchCard({ cardIds: [payload.newCard.id] }).catch(console.error);
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

	const updateBoardTitle = async (payload: UpdateBoardTitleMessageParams) => {
		const result = await emitAndWait('update-board-title', payload);
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

	const createAndUpdateTextElement = async (cardId: string, text: string, simulateTyping = true) => {
		const element = await createElement({
			cardId,
			type: ContentElementType.RICH_TEXT,
		});

		let textChunks: string[] = [];
		if (simulateTyping === true) {
			textChunks = chunk(text.split(''), 20).map((c) => c.join(''));
		} else {
			textChunks = [text];
		}

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
		disconnect,
		fetchBoard,
		fetchCard,
		moveColumn,
		moveCard,
		updateBoardTitle,
		updateColumnTitle,
		updateCardTitle,
		updateElement,
		emitOnSocket,
		getResponseTimes,
		waitForSuccess,
		getCardPosition,
		getColumnPosition,
		mockIncommingEvent,
		logs,
	};
}
