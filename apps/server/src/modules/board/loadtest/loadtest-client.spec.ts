// Rest of the code...
import { InputFormat } from '@shared/domain/types';
import { ContentElementType } from '../domain';
import { LoadtestClient } from './loadtest-client';
import { SocketConnection } from './socket-connection';
import { UpdateContentElementMessageParams } from '../gateway/dto';

jest.mock('./socket-connection');

describe('LoadtestClient', () => {
	let loadtestClient: LoadtestClient;
	let socketConnection: SocketConnection;
	const boardId = 'board123';

	beforeEach(() => {
		socketConnection = new SocketConnection({ path: '', baseUrl: '', token: '' }, console.log);

		loadtestClient = new LoadtestClient(socketConnection, boardId);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('fetchBoard', () => {
		it('should fetch the board', async () => {
			socketConnection.emitAndWait = jest.fn();

			await loadtestClient.fetchBoard();

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('fetch-board', expect.objectContaining({ boardId }));
		});
	});

	describe('fetchCard', () => {
		it('should fetch a card', async () => {
			const cardId = 'my-card-id';
			const payload = { cardIds: [cardId] };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newCard: { id: cardId } });

			await loadtestClient.fetchCard(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('fetch-card', payload);
		});
	});

	describe('createColumn', () => {
		it('should create a column', async () => {
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newColumn: { id: 'column123' } });

			await loadtestClient.createColumn();

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('create-column', { boardId });
		});
	});

	describe('createCard', () => {
		it('should create a card', async () => {
			const payload = { title: 'New Card', columnId: 'column123' };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newCard: { id: 'card123' } });

			await loadtestClient.createCard(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('create-card', payload);
		});
	});

	describe('deleteColumn', () => {
		it('should delete a column', async () => {
			const columnId = 'column123';
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ columnId });

			await loadtestClient.deleteColumn({ columnId });

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('delete-column', { columnId });
		});
	});

	describe('deleteCard', () => {
		it('should delete a card', async () => {
			const payload = { cardId: 'card123' };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce(payload);

			await loadtestClient.deleteCard(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('delete-card', payload);
		});
	});

	describe('deleteElement', () => {
		it('should delete an element', async () => {
			const payload = { cardId: 'my-card-id', elementId: 'element123' };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce(payload);

			await loadtestClient.deleteElement(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('delete-element', payload);
		});
	});

	describe('createElement', () => {
		it('should create an element', async () => {
			const cardId = 'my-card-id';
			const payload = { cardId, type: ContentElementType.RICH_TEXT, content: 'Hello World' };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newElement: { id: 'element123' } });

			await loadtestClient.createElement(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('create-element', payload);
		});
	});

	describe('updateBoardTitle', () => {
		it('should update the board title', async () => {
			const payload = {
				boardId: 'board123',
				newTitle: 'New Board Title',
			};
			socketConnection.emitAndWait = jest.fn();

			await loadtestClient.updateBoardTitle(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-board-title', payload);
		});
	});

	describe('updateColumnTitle', () => {
		it('should update the column title', async () => {
			const payload = {
				columnId: 'column123',
				newTitle: 'New Column Title',
			};
			socketConnection.emitAndWait = jest.fn();

			await loadtestClient.updateColumnTitle(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-column-title', payload);
		});
	});

	describe('updateCardTitle', () => {
		it('should update the card title', async () => {
			const payload = { cardId: 'card123', newTitle: 'New Card Title' };
			socketConnection.emitAndWait = jest.fn();

			await loadtestClient.updateCardTitle(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-card-title', payload);
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
			socketConnection.emitAndWait = jest.fn();

			await loadtestClient.updateElement(payload);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-element', payload);
		});
	});

	describe('createAndUpdateLinkElement', () => {
		it('should create and update a link element', async () => {
			const cardId = 'card123';
			const content = { url: 'https://example.com', title: 'Example' };
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

			await loadtestClient.createAndUpdateLinkElement(cardId, content);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith(
				'create-element',
				expect.objectContaining({ cardId, type: 'link' })
			);
			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-element', expect.any(Object));
		});
	});

	describe('createAndUpdateTextElement', () => {
		it('should create and update a text element', async () => {
			const cardId = 'card123';
			const text = 'Lorem ipsum dolor sit amet';
			const simulateTyping = true;
			socketConnection.emitAndWait = jest.fn().mockResolvedValueOnce({ newElement: { elementId: 'element123' } });

			await loadtestClient.createAndUpdateTextElement(cardId, text, simulateTyping);

			expect(socketConnection.emitAndWait).toHaveBeenCalledWith(
				'create-element',
				expect.objectContaining({
					cardId,
					type: ContentElementType.RICH_TEXT,
				})
			);
			expect(socketConnection.emitAndWait).toHaveBeenCalledWith('update-element', expect.any(Object));
		});
	});
});
