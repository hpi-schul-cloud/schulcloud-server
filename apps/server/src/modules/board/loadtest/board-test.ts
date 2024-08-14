/* eslint-disable no-await-in-loop */
import { ColumnResponse } from '../controller/dto';
import { duplicateUserProfiles } from './helper/classDefinitions';
import { getRandomCardTitle, getRandomLink, getRandomRichContentBody } from './helper/randomData';
import { getSummaryText } from './helper/responseTimes';
import { sleep } from './helper/sleep';
import { createLoadtestClient, LoadtestClient } from './loadtestClientFactory';
import { SocketConnectionManager } from './SocketConnectionManager';
import { ClassDefinition, ResponseTimeRecord, UserProfile } from './types';

export class BoardTest {
	private columns: { id: string; cards: { id: string }[] }[] = [];

	private errors: string[] = [];

	constructor(private socketConnectionManager: SocketConnectionManager) {}

	async runBoardTest(
		boardId: string,
		configuration: ClassDefinition
	): Promise<{ responseTimes: ResponseTimeRecord[] }[]> {
		// const board = await this.socketConnectionRenaming!.fetchBoard();
		// console.log(`${board.title ?? ''} fetched`);

		try {
			const userProfiles = duplicateUserProfiles(configuration.users);
			const userClients = await this.initializeLoadtestClients(userProfiles.length, boardId);
			console.log(userClients.length);
			await this.simulateUsersActions(userClients, userProfiles);

			// const results = await Promise.all([...promises]);
			// const responseTimes = results.flatMap((res) => res.responseTimes);
			// const sum = responseTimes.reduce((all, cur) => all + cur.responseTime, 0);
			// await this.socketConnectionRenaming.updateBoardTitle({
			// 	boardId,
			// 	newTitle: `${board.title ?? ''} - ${responseTimes.length} actions (avg response time: ${(
			// 		sum / responseTimes.length
			// 	).toFixed(2)} ms)`,
			// });
			// boardClient.disconnect();
			// console.log(sum);
			// await sleep(2000);
			// return results;
		} catch (err) {
			// incErrorCount();
			console.error(err);
		}
		return [];
	}

	async initializeLoadtestClients(amount: number, boardId: string): Promise<LoadtestClient[]> {
		const promises = Array(amount)
			.fill(1)
			.map(() => this.initializeLoadtestClient(boardId));
		const results = await Promise.all(promises);
		return results;
	}

	async initializeLoadtestClient(boardId: string): Promise<LoadtestClient> {
		const socketConnection = await this.socketConnectionManager.createConnection();
		const socket = createLoadtestClient(socketConnection, boardId);
		return socket;
	}

	async simulateUsersActions(loadtestClients: LoadtestClient[], userProfiles: UserProfile[]) {
		const promises = loadtestClients.map((loadtestClient, index) =>
			this.simulateUserActions(loadtestClient, userProfiles[index])
		);
		await Promise.all(promises);
	}

	async simulateUserActions(loadtestClient: LoadtestClient, userProfile: UserProfile) {
		const startTime = performance.now();
		while (performance.now() - startTime < 3 * 60000) {
			try {
				if (this.columnCount() === 0) {
					await this.createColumn(loadtestClient);
				} else if (this.columnCount() > 20) {
					await this.createRandomCard(loadtestClient, userProfile.sleepMs);
				} else if (Math.random() > 0.8) {
					await this.createColumn(loadtestClient);
				} else {
					await this.createRandomCard(loadtestClient, userProfile.sleepMs);
				}
			} catch (err) {
				this.trackError(err as Error);
			}
		}
	}

	// async createUserColumn(loadtestClient: LoadtestClient, userProfile: UserProfile, waitTimeMs: number) {
	// 	await sleep(waitTimeMs);

	// 	let responseTimes: Array<ResponseTimeRecord> = [];
	// 	let errors: Array<string> = [];
	// 	if (userProfile.maxCards > 0) {
	// 		let column: ColumnResponse | undefined;
	// 		try {
	// 			column = await loadtestClient.createColumn();
	// 			const position = this.trackColumn(column.id);
	// 			await loadtestClient.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
	// 		} catch (err) {
	// 			// incErrorCount();
	// 			errors.push((err as Error).message);
	// 		}
	// 		if (column) {
	// 			const additionalErrors = await this.createCards(loadtestClient, userProfile);
	// 			errors = [...errors, ...additionalErrors];
	// 			try {
	// 				await loadtestClient.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte (fertig)` });
	// 			} catch (err) {
	// 				// incErrorCount();
	// 				errors.push((err as Error).message);
	// 			}
	// 			responseTimes = loadtestClient.getResponseTimes();
	// 			try {
	// 				await this.createSummaryCard(loadtestClient, column, responseTimes);
	// 			} catch (err) {
	// 				// incErrorCount();
	// 				errors.push((err as Error).message);
	// 			}
	// 		}
	// 	}
	// 	return { socket: loadtestClient, responseTimes, errors };
	// }

	async createColumn(loadtestClient: LoadtestClient) {
		const column = await loadtestClient.createColumn();
		const position = this.trackColumn(column.id);
		await loadtestClient.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
	}

	async createCards(loadtestClient: LoadtestClient, userProfile: UserProfile) {
		const errors: Array<string> = [];
		for (let i = 0; i < userProfile.maxCards; i += 1) {
			try {
				await this.createRandomCard(loadtestClient, userProfile.sleepMs);
			} catch (err) {
				// incErrorCount();
				errors.push((err as Error).message);
			}
		}
		return errors;
	}

	async createSummaryCard(
		loadtestClient: LoadtestClient,
		column: ColumnResponse,
		responseTimes: Array<ResponseTimeRecord>
	) {
		const summaryCard = await loadtestClient.createCard({ columnId: column.id });
		// await socket.moveCard(column.id, summaryCard.id, socket.getCardPosition(summaryCard.id), 0);

		await loadtestClient.updateCardTitle({
			cardId: summaryCard.id,
			newTitle: `Summary: ${responseTimes.length} requests`,
		});
		const summaryText = getSummaryText(responseTimes);
		await loadtestClient.createAndUpdateTextElement(summaryCard.id, summaryText, false);
		return responseTimes;
	}

	async createRandomCard(loadtestClient: LoadtestClient, pauseMs = 1000) {
		const columnId = this.getRandomColumnId();
		const card = await loadtestClient.createCard({ columnId });
		this.trackCard(columnId, card.id);
		await sleep(pauseMs);
		await loadtestClient.updateCardTitle({ cardId: card.id, newTitle: getRandomCardTitle() });
		await sleep(pauseMs);
		for (let i = 0; i < Math.ceil(Math.random() * 5); i += 1) {
			await this.createRandomElement(loadtestClient, card.id);
			await sleep(pauseMs);
		}
	}

	async createRandomElement(loadtestClient: LoadtestClient, cardId: string) {
		if (Math.random() > 0.5) {
			await loadtestClient.createAndUpdateLinkElement(cardId, getRandomLink());
		} else {
			await loadtestClient.createAndUpdateTextElement(cardId, getRandomRichContentBody());
		}
	}

	trackColumn(columnId: string) {
		this.columns.push({ id: columnId, cards: [] });
		return this.columns.length;
	}

	trackCard(columnId: string, cardId: string) {
		const column = this.columns.find((col) => col.id === columnId);
		if (column) {
			column.cards.push({ id: cardId });
		} else {
			throw new Error(`Column not found: ${columnId}`);
		}
	}

	columnCount() {
		return this.columns.length;
	}

	getRandomColumnId() {
		return this.columns[Math.floor(Math.random() * this.columns.length)].id;
	}

	trackError(error: Error) {
		this.errors.push(error.message);
		console.log(error.message);
	}
}
