/* eslint-disable no-await-in-loop */
import { duplicateUserProfiles } from './helper/class-definitions';
import { getRandomCardTitle, getRandomLink, getRandomRichContentBody } from './helper/randomData';
import { sleep } from './helper/sleep';
import { createLoadtestClient, LoadtestClient } from './loadtest-client';
import { SocketConnection } from './socket-connection';
import { SocketConnectionManager } from './socket-connection-manager';
import { Callback, ClassDefinition, UserProfile } from './types';

const SIMULATE_USER_TIME_MS = 120000;

export class BoardLoadTest {
	private columns: { id: string; cards: { id: string }[] }[] = [];

	private userProfiles: UserProfile[] = [];

	private loadtestClients: LoadtestClient[] = [];

	constructor(
		private socketConnectionManager: SocketConnectionManager,
		classDefinition: ClassDefinition,
		private onError: Callback
	) {
		this.userProfiles = duplicateUserProfiles(classDefinition.users);
	}

	async runBoardTest(): Promise<void> {
		try {
			await this.simulateUsersActions();
		} catch (err) {
			this.onError((err as Error).message);
		}
	}

	async initializeLoadtestClients(boardId: string): Promise<void> {
		const connections = await this.socketConnectionManager.createConnections(this.userProfiles.length);
		this.loadtestClients = connections.map((socketConnection: SocketConnection) => {
			const loadtestClient = createLoadtestClient(socketConnection, boardId);
			return loadtestClient;
		});
	}

	async simulateUsersActions() {
		// eslint-disable-next-line arrow-body-style
		const promises = this.loadtestClients.map((loadtestClient, index) => {
			/* istanbul ignore next */
			return this.simulateUserActions(loadtestClient, this.userProfiles[index]);
		});
		await Promise.all(promises);
	}

	async simulateUserActions(loadtestClient: LoadtestClient, userProfile: UserProfile, actionsMax = 1000000) {
		const startTime = performance.now();

		await sleep(Math.ceil(Math.random() * 20000));

		/* istanbul ignore next */
		await loadtestClient.fetchBoard();

		let actionCount = 0;
		while (performance.now() - startTime < SIMULATE_USER_TIME_MS && actionCount < actionsMax) {
			if (userProfile.isActive) {
				try {
					if (this.columnCount() === 0) {
						await this.createColumn(loadtestClient);
					} else if (this.columnCount() > 20) {
						/* istanbul ignore next */
						await this.createRandomCard(loadtestClient, userProfile.sleepMs);
					} else if (Math.random() > 0.8) {
						await this.createColumn(loadtestClient);
					} else {
						await this.createRandomCard(loadtestClient, userProfile.sleepMs);
					}
					actionCount += 1;
				} catch (err) {
					/* istanbul ignore next */
					this.onError((err as Error).message);
				}
			}
			await sleep(userProfile.sleepMs);
		}
	}

	async createColumn(loadtestClient: LoadtestClient) {
		const column = await loadtestClient.createColumn();
		const position = this.trackColumn(column.id);
		await loadtestClient.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
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
			/* istanbul ignore next */
			throw new Error(`Column not found: ${columnId}`);
		}
	}

	columnCount() {
		return this.columns.length;
	}

	getRandomColumnId() {
		return this.columns[Math.floor(Math.random() * this.columns.length)].id;
	}
}
