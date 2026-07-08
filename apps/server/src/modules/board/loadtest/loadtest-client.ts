import { InputFormat } from '@shared/domain/types';
import { chunk } from 'lodash';
import {
	type AnyContentElementResponse,
	type BoardResponse,
	type CardResponse,
	type ColumnResponse,
	type LinkContentBody,
} from '../controller/dto';
import { ContentElementType } from '../domain';
import {
	type CreateCardMessageParams,
	type CreateContentElementMessageParams,
	type DeleteCardMessageParams,
	type DeleteColumnMessageParams,
	type DeleteContentElementMessageParams,
	type FetchCardsMessageParams,
	type UpdateBoardTitleMessageParams,
	type UpdateCardTitleMessageParams,
	type UpdateColumnTitleMessageParams,
	type UpdateContentElementMessageParams,
} from '../gateway/dto';
import { sleep } from './helper/sleep';
import { type SocketConnection } from './socket-connection';

export class LoadtestClient {
	constructor(
		private readonly socket: SocketConnection,
		private readonly boardId: string
	) {}

	async fetchBoard(): Promise<BoardResponse> {
		const result = (await this.socket.emitAndWait('fetch-board', { boardId: this.boardId })) as BoardResponse;
		return result;
	}

	async fetchCard(payload: FetchCardsMessageParams): Promise<CardResponse> {
		const { newCard } = (await this.socket.emitAndWait('fetch-card', payload)) as { newCard: CardResponse };
		return newCard;
	}

	async createColumn(): Promise<ColumnResponse> {
		const { newColumn } = (await this.socket.emitAndWait('create-column', { boardId: this.boardId })) as {
			newColumn: ColumnResponse;
		};
		return newColumn;
	}

	async createCard(payload: CreateCardMessageParams): Promise<CardResponse> {
		const { newCard } = (await this.socket.emitAndWait('create-card', payload)) as { newCard: CardResponse };
		return newCard;
	}

	async deleteColumn(payload: DeleteColumnMessageParams): Promise<{ columnId: string }> {
		const result = (await this.socket.emitAndWait('delete-column', payload)) as { columnId: string };
		return result;
	}

	async deleteCard(payload: DeleteCardMessageParams): Promise<{ cardId: string }> {
		const result = (await this.socket.emitAndWait('delete-card', payload)) as { cardId: string };
		return result;
	}

	async deleteElement(payload: DeleteContentElementMessageParams): Promise<{ elementId: string }> {
		const result = (await this.socket.emitAndWait('delete-element', payload)) as { elementId: string };
		return result;
	}

	async createElement(payload: CreateContentElementMessageParams): Promise<AnyContentElementResponse> {
		const { newElement } = (await this.socket.emitAndWait('create-element', payload)) as {
			newElement: AnyContentElementResponse;
		};
		return newElement;
	}

	async updateBoardTitle(payload: UpdateBoardTitleMessageParams): Promise<unknown> {
		const result = await this.socket.emitAndWait('update-board-title', payload);
		return result;
	}

	async updateColumnTitle(payload: UpdateColumnTitleMessageParams): Promise<unknown> {
		const result = await this.socket.emitAndWait('update-column-title', payload);
		return result;
	}

	async updateCardTitle(payload: UpdateCardTitleMessageParams): Promise<unknown> {
		const result = await this.socket.emitAndWait('update-card-title', payload);
		return result;
	}

	async updateElement(payload: UpdateContentElementMessageParams): Promise<unknown> {
		const result = await this.socket.emitAndWait('update-element', payload);
		return result;
	}

	async createAndUpdateLinkElement(cardId: string, content: LinkContentBody): Promise<unknown> {
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

	async createAndUpdateTextElement(
		cardId: string,
		text: string,
		simulateTyping = true
	): Promise<UpdateContentElementMessageParams> {
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

export const createLoadtestClient = (socket: SocketConnection, boardId: string): LoadtestClient =>
	new LoadtestClient(socket, boardId);
