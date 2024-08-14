/* eslint-disable no-await-in-loop */
import { ColumnResponse } from '../controller/dto';
import { duplicateUserProfiles } from './helper/classDefinitions';
import { getRandomCardTitle, getRandomLink, getRandomRichContentBody } from './helper/randomData';
import { sleep } from './helper/sleep';
import { createLoadtestClient, LoadtestClient } from './loadtestClientFactory';
import { SocketConnectionManager } from './SocketConnectionManager';
import { ClassDefinition, ResponseTimeRecord, UserProfile } from './types';

export class BoardTest {
	constructor(private socketConnectionManager: SocketConnectionManager) {}

	async runBoardTest(
		boardId: string,
		configuration: ClassDefinition
	): Promise<{ responseTimes: ResponseTimeRecord[] }[]> {
		// const board = await this.socketConnectionRenaming!.fetchBoard();
		// console.log(`${board.title ?? ''} fetched`);

		const userProfiles = duplicateUserProfiles(configuration.users);
		const userClients = await this.initializeLoadtestClients(userProfiles.length, boardId);
		const promises = userProfiles.map((userProfile: UserProfile, index) => {
			const waitTimeMs = index * 500;
			return this.createUserColumn(userClients[index], index + 1, userProfile, waitTimeMs);
		});

		try {
			const results = await Promise.all([...promises]);
			const responseTimes = results.flatMap((res) => res.responseTimes);
			const sum = responseTimes.reduce((all, cur) => all + cur.responseTime, 0);
			// await this.socketConnectionRenaming.updateBoardTitle({
			// 	boardId,
			// 	newTitle: `${board.title ?? ''} - ${responseTimes.length} actions (avg response time: ${(
			// 		sum / responseTimes.length
			// 	).toFixed(2)} ms)`,
			// });
			// boardClient.disconnect();
			console.log(sum);

			await sleep(2000);

			return results;
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

	async createUserColumn(client: LoadtestClient, position: number, userProfile: UserProfile, waitTimeMs: number) {
		await sleep(waitTimeMs);

		let responseTimes: Array<ResponseTimeRecord> = [];
		let errors: Array<string> = [];
		if (userProfile.maxCards > 0) {
			let column: ColumnResponse | undefined;
			try {
				column = await client.createColumn();
				await client.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
			} catch (err) {
				// incErrorCount();
				errors.push((err as Error).message);
			}
			if (column) {
				const additionalErrors = await this.createCards(client, column, userProfile);
				errors = [...errors, ...additionalErrors];
				try {
					await client.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte (fertig)` });
				} catch (err) {
					// incErrorCount();
					errors.push((err as Error).message);
				}
				responseTimes = client.getResponseTimes();
				try {
					await this.createSummaryCard(client, column, responseTimes);
				} catch (err) {
					// incErrorCount();
					errors.push((err as Error).message);
				}
			}
		}
		return { socket: client, responseTimes, errors };
	}

	async createCards(socket: LoadtestClient, column: ColumnResponse, userProfile: UserProfile) {
		const errors: Array<string> = [];
		for (let i = 0; i < userProfile.maxCards; i += 1) {
			try {
				await this.createRandomCard(socket, column, userProfile.sleepMs);
			} catch (err) {
				// incErrorCount();
				errors.push((err as Error).message);
			}
		}
		return errors;
	}

	async createSummaryCard(socket: LoadtestClient, column: ColumnResponse, responseTimes: Array<ResponseTimeRecord>) {
		const summaryCard = await socket.createCard({ columnId: column.id });
		// await socket.moveCard(column.id, summaryCard.id, socket.getCardPosition(summaryCard.id), 0);

		await socket.updateCardTitle({
			cardId: summaryCard.id,
			newTitle: `Summary: ${responseTimes.length} requests`,
		});
		const summaryText = getSummaryText(responseTimes);
		await socket.createAndUpdateTextElement(summaryCard.id, summaryText, false);
		return responseTimes;
	}

	async createRandomCard(socket: LoadtestClient, column: ColumnResponse, pauseMs = 1000) {
		const card = await socket.createCard({ columnId: column.id });
		await sleep(pauseMs);
		await socket.updateCardTitle({ cardId: card.id, newTitle: getRandomCardTitle() });
		await sleep(pauseMs);
		for (let i = 0; i < Math.ceil(Math.random() * 5); i += 1) {
			await this.createRandomElement(socket, card.id);
			await sleep(pauseMs);
		}
	}

	async createRandomElement(socket: LoadtestClient, cardId: string) {
		if (Math.random() > 0.5) {
			await socket.createAndUpdateLinkElement(cardId, getRandomLink());
		} else {
			await socket.createAndUpdateTextElement(cardId, getRandomRichContentBody());
		}
	}
}
