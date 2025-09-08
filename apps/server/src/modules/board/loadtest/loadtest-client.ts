/* eslint-disable no-await-in-loop */
import { chunk } from 'lodash';
import { InputFormat } from '@shared/domain/types';
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
import { SocketConnection } from './socket-connection';
import { sleep } from './helper/sleep';

export class LoadtestClient {
	constructor(private socket: SocketConnection, private boardId: string) {}

	async fetchBoard() {
		const result = (await this.socket.emitAndWait('fetch-board', { boardId: this.boardId })) as BoardResponse;
		return result;
	}

	async fetchCard(payload: FetchCardsMessageParams) {
		const { newCard } = (await this.socket.emitAndWait('fetch-card', payload)) as { newCard: CardResponse };
		return newCard;
	}

	async createColumn() {
		const { newColumn } = (await this.socket.emitAndWait('create-column', { boardId: this.boardId })) as {
			newColumn: ColumnResponse;
		};
		return newColumn;
	}

	async createCard(payload: CreateCardMessageParams) {
		const { newCard } = (await this.socket.emitAndWait('create-card', payload)) as { newCard: CardResponse };
		return newCard;
	}

	async deleteColumn(payload: DeleteColumnMessageParams) {
		const result = (await this.socket.emitAndWait('delete-column', payload)) as { columnId: string };
		return result;
	}

	async deleteCard(payload: DeleteCardMessageParams) {
		const result = (await this.socket.emitAndWait('delete-card', payload)) as { cardId: string };
		return result;
	}

	async deleteElement(payload: DeleteContentElementMessageParams) {
		const result = (await this.socket.emitAndWait('delete-element', payload)) as { elementId: string };
		return result;
	}

	async createElement(payload: CreateContentElementMessageParams) {
		const { newElement } = (await this.socket.emitAndWait('create-element', payload)) as {
			newElement: AnyContentElementResponse;
		};
		return newElement;
	}

	async updateBoardTitle(payload: UpdateBoardTitleMessageParams) {
		const result = await this.socket.emitAndWait('update-board-title', payload);
		return result;
	}

	async updateColumnTitle(payload: UpdateColumnTitleMessageParams) {
		const result = await this.socket.emitAndWait('update-column-title', payload);
		return result;
	}

	async updateCardTitle(payload: UpdateCardTitleMessageParams) {
		const result = await this.socket.emitAndWait('update-card-title', payload);
		return result;
	}

	async updateElement(payload: UpdateContentElementMessageParams) {
		const result = await this.socket.emitAndWait('update-element', payload);
		return result;
	}

	async createAndUpdateLinkElement(cardId: string, content: LinkContentBody) {
		const element = await this.createElement({
			cardId,
			type: ContentElementType.LINK,
		});
		const result = await this.updateElement({
			elementId: element.id,
			data: { type: ContentElementType.LINK, content },
		});
		return result;
	}

	async createAndUpdateTextElement(cardId: string, text: string, simulateTyping = true) {
		const element = await this.createElement({
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
			result = await this.updateElement({
				elementId: element.id,
				data: {
					type: ContentElementType.RICH_TEXT,
					content: {
						inputFormat: InputFormat.RICH_TEXT_CK5,
						text: `<p>${currentText}</p>`,
					},
				},
			});

			await sleep(500);
		}
		return result as UpdateContentElementMessageParams;
	}
}

export const createLoadtestClient = (socket: SocketConnection, boardId: string) => new LoadtestClient(socket, boardId);
