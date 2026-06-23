// Rest of the code...
import { InputFormat } from '@shared/domain/types';
import { ContentElementType } from '../domain';
import { UpdateContentElementMessageParams } from '../gateway/dto';
import { LoadtestClient } from './loadtest-client';
import { SocketConnection } from './socket-connection';

describe('LoadtestClient', () => {
	let loadtestClient: LoadtestClient;
	let socketConnection: SocketConnection;
	let emitAndWaitMock: jest.Mock;
	const boardId = 'board123';

	beforeEach(() => {
		emitAndWaitMock = jest.fn();
		socketConnection = {
			emitAndWait: emitAndWaitMock,
		} as unknown as SocketConnection;

		loadtestClient = new LoadtestClient(socketConnection, boardId);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('fetchBoard', () => {
		it('should fetch the board', async () => {
			emitAndWaitMock.mockResolvedValueOnce({});

			await loadtestClient.fetchBoard();

			expect(emitAndWaitMock).toHaveBeenCalledWith('fetch-board', expect.objectContaining({ boardId }));
		});
	});

	describe('fetchCard', () => {
		it('should fetch a card', async () => {
			const cardId = 'my-card-id';
			const payload = { cardIds: [cardId] };
			emitAndWaitMock.mockResolvedValueOnce({ newCard: { id: cardId } });

			await loadtestClient.fetchCard(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('fetch-card', payload);
		});
	});

	describe('createColumn', () => {
		it('should create a column', async () => {
			emitAndWaitMock.mockResolvedValueOnce({ newColumn: { id: 'column123' } });

			await loadtestClient.createColumn();

			expect(emitAndWaitMock).toHaveBeenCalledWith('create-column', { boardId });
		});
	});

	describe('createCard', () => {
		it('should create a card', async () => {
			const payload = { title: 'New Card', columnId: 'column123' };
			emitAndWaitMock.mockResolvedValueOnce({ newCard: { id: 'card123' } });

			await loadtestClient.createCard(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('create-card', payload);
		});
	});

	describe('deleteColumn', () => {
		it('should delete a column', async () => {
			const columnId = 'column123';
			emitAndWaitMock.mockResolvedValueOnce({ columnId });

			await loadtestClient.deleteColumn({ columnId });

			expect(emitAndWaitMock).toHaveBeenCalledWith('delete-column', { columnId });
		});
	});

	describe('deleteCard', () => {
		it('should delete a card', async () => {
			const payload = { cardId: 'card123' };
			emitAndWaitMock.mockResolvedValueOnce(payload);

			await loadtestClient.deleteCard(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('delete-card', payload);
		});
	});

	describe('deleteElement', () => {
		it('should delete an element', async () => {
			const payload = { cardId: 'my-card-id', elementId: 'element123' };
			emitAndWaitMock.mockResolvedValueOnce(payload);

			await loadtestClient.deleteElement(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('delete-element', payload);
		});
	});

	describe('createElement', () => {
		it('should create an element', async () => {
			const cardId = 'my-card-id';
			const payload = { cardId, type: ContentElementType.RICH_TEXT, content: 'Hello World' };
			emitAndWaitMock.mockResolvedValueOnce({ newElement: { id: 'element123' } });

			await loadtestClient.createElement(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('create-element', payload);
		});
	});

	describe('updateBoardTitle', () => {
		it('should update the board title', async () => {
			const payload = {
				boardId: 'board123',
				newTitle: 'New Board Title',
			};
			emitAndWaitMock.mockResolvedValueOnce({});

			await loadtestClient.updateBoardTitle(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('update-board-title', payload);
		});
	});

	describe('updateColumnTitle', () => {
		it('should update the column title', async () => {
			const payload = {
				columnId: 'column123',
				newTitle: 'New Column Title',
			};
			emitAndWaitMock.mockResolvedValueOnce({});

			await loadtestClient.updateColumnTitle(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('update-column-title', payload);
		});
	});

	describe('updateCardTitle', () => {
		it('should update the card title', async () => {
			const payload = { cardId: 'card123', newTitle: 'New Card Title' };
			emitAndWaitMock.mockResolvedValueOnce({});

			await loadtestClient.updateCardTitle(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('update-card-title', payload);
		});
	});

	describe('updateElement', () => {
		it('should update an element', async () => {
			const payload = {
				elementId: 'my-element-id',
				data: {
					type: ContentElementType.RICH_TEXT,
					content: {
						inputFormat: InputFormat.RICH_TEXT_CK5,
						text: `<p>Some text...</p>`,
					},
				},
			} as UpdateContentElementMessageParams;
			emitAndWaitMock.mockResolvedValueOnce({});

			await loadtestClient.updateElement(payload);

			expect(emitAndWaitMock).toHaveBeenCalledWith('update-element', payload);
		});
	});

	describe('createAndUpdateLinkElement', () => {
		it('should create and update a link element', async () => {
			const cardId = 'card123';
			const content = { url: 'https://example.com', title: 'Example' };
			emitAndWaitMock.mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

			await loadtestClient.createAndUpdateLinkElement(cardId, content);

			expect(emitAndWaitMock).toHaveBeenCalledWith('create-element', expect.objectContaining({ cardId, type: 'link' }));
			expect(emitAndWaitMock).toHaveBeenCalledWith('update-element', expect.any(Object));
		});
	});

	describe('createAndUpdateTextElement', () => {
		describe('when text is shorter than 20 characters', () => {
			it('should create and update a text element', async () => {
				const cardId = 'card123';
				const text = 'Lorem ipsum';
				const simulateTyping = true;
				emitAndWaitMock.mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

				await loadtestClient.createAndUpdateTextElement(cardId, text, simulateTyping);

				expect(emitAndWaitMock).toHaveBeenCalledWith(
					'create-element',
					expect.objectContaining({
						cardId,
						type: ContentElementType.RICH_TEXT,
					})
				);
				expect(emitAndWaitMock).toHaveBeenCalledTimes(2);
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(1, 'create-element', expect.any(Object));
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(2, 'update-element', expect.any(Object));
			});
		});

		describe('when text is longer than 20 characters', () => {
			it('should send multiple updates', async () => {
				const cardId = 'card123';
				const text = 'Lorem ipsum dolor sit amet consectetur';
				const simulateTyping = true;
				emitAndWaitMock.mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

				await loadtestClient.createAndUpdateTextElement(cardId, text, simulateTyping);

				expect(emitAndWaitMock).toHaveBeenCalledWith(
					'create-element',
					expect.objectContaining({
						cardId,
						type: ContentElementType.RICH_TEXT,
					})
				);
				expect(emitAndWaitMock).toHaveBeenCalledTimes(3);
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(1, 'create-element', expect.any(Object));
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(2, 'update-element', expect.any(Object));
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(3, 'update-element', expect.any(Object));
			});
		});

		describe('when slicing is deactivated', () => {
			it('should send one update', async () => {
				const cardId = 'card123';
				const text = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt.';
				const simulateTyping = false;
				emitAndWaitMock.mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

				await loadtestClient.createAndUpdateTextElement(cardId, text, simulateTyping);

				expect(emitAndWaitMock).toHaveBeenCalledWith(
					'create-element',
					expect.objectContaining({
						cardId,
						type: ContentElementType.RICH_TEXT,
					})
				);

				expect(emitAndWaitMock).toHaveBeenCalledTimes(2);
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(1, 'create-element', expect.any(Object));
				expect(emitAndWaitMock).toHaveBeenNthCalledWith(2, 'update-element', expect.any(Object));
			});
		});
	});
});
