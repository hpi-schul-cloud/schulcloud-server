/* eslint-disable no-await-in-loop */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-process-env */
import { writeFileSync } from 'fs';
import { performance } from 'perf_hooks';
import { flatten } from 'lodash';
import { ColumnResponse } from '../controller/dto';
import {
	createLoadtestClient,
	getClientCount,
	incErrorCount,
	getErrorCount,
	LoadtestClient,
} from './loadtestClientFactory';
import { createBoards, getToken } from './helper/createBoards';
import { UserProfile, UrlConfiguration, ResponseTimeRecord, ClassDefinition, ClassDefinitionWithAmount } from './types';
import { getUrlConfiguration } from './helper/getUrlConfiguration';
import { getRandomCardTitle, getRandomLink, getRandomRichContentBody } from './helper/randomData';
import {
	viewersClass,
	createSeveralClasses,
	duplicateUserProfiles as extractUserProfiles,
	collaborativeClass,
} from './helper/classDefinitions';
import { getStats, getSummaryText } from './helper/responseTimes';
import { formatDate } from './helper/formatDate';

describe('Board Collaboration Load Test', () => {
	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const createRandomElement = async (socket: LoadtestClient, cardId: string) => {
		if (Math.random() > 0.5) {
			await socket.createAndUpdateLinkElement(cardId, getRandomLink());
		} else {
			await socket.createAndUpdateTextElement(cardId, getRandomRichContentBody());
		}
	};

	const createRandomCard = async (socket: LoadtestClient, column: ColumnResponse, pauseMs = 1000) => {
		const card = await socket.createCard({ columnId: column.id });
		await sleep(pauseMs);
		await socket.updateCardTitle({ cardId: card.id, newTitle: getRandomCardTitle() });
		await sleep(pauseMs);
		for (let i = 0; i < Math.ceil(Math.random() * 5); i += 1) {
			await createRandomElement(socket, card.id);
			await sleep(pauseMs);
		}
	};

	const createCards = async (socket: LoadtestClient, column: ColumnResponse, userProfile: UserProfile) => {
		const errors: Array<string> = [];
		for (let i = 0; i < userProfile.maxCards; i += 1) {
			try {
				await createRandomCard(socket, column, userProfile.sleepMs);
			} catch (err) {
				incErrorCount();
				errors.push((err as Error).message);
			}
		}
		return errors;
	};

	const createSummaryCard = async (
		socket: LoadtestClient,
		column: ColumnResponse,
		responseTimes: Array<ResponseTimeRecord>
	) => {
		const summaryCard = await socket.createCard({ columnId: column.id });
		// await socket.moveCard(column.id, summaryCard.id, socket.getCardPosition(summaryCard.id), 0);

		await socket.updateCardTitle({
			cardId: summaryCard.id,
			newTitle: `Summary: ${responseTimes.length} requests`,
		});
		const summaryText = getSummaryText(responseTimes);
		await socket.createAndUpdateTextElement(summaryCard.id, summaryText, false);
		return responseTimes;
	};

	const createUserColumn = async (
		client: LoadtestClient,
		position: number,
		userProfile: UserProfile,
		waitTimeMs: number
	) => {
		await sleep(waitTimeMs);

		let responseTimes: Array<ResponseTimeRecord> = [];
		let errors: Array<string> = [];
		if (userProfile.maxCards > 0) {
			let column: ColumnResponse | undefined;
			try {
				column = await client.createColumn();
				await client.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
			} catch (err) {
				incErrorCount();
				errors.push((err as Error).message);
			}
			if (column) {
				const additionalErrors = await createCards(client, column, userProfile);
				errors = [...errors, ...additionalErrors];
				try {
					await client.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte (fertig)` });
				} catch (err) {
					incErrorCount();
					errors.push((err as Error).message);
				}
				responseTimes = client.getResponseTimes();
				try {
					await createSummaryCard(client, column, responseTimes);
				} catch (err) {
					incErrorCount();
					errors.push((err as Error).message);
				}
			}
		}
		return { socket: client, responseTimes, errors };
	};

	const initializeLoadtestClient = async (target: string, boardId: string): Promise<LoadtestClient> => {
		const socket = createLoadtestClient(target, boardId, getToken());
		await socket.connect();
		return socket;
	};

	const initializeLoadtestClients = async (
		amount: number,
		target: string,
		boardId: string
	): Promise<LoadtestClient[]> => {
		const promises = Array(amount)
			.fill(1)
			.map(() => initializeLoadtestClient(target, boardId));
		const results = await Promise.all(promises);
		return results;
	};

	const runBoardTest = async (boardId: string, configuration: ClassDefinition, urls: UrlConfiguration) => {
		const boardClient = createLoadtestClient(urls.websocket, boardId, getToken());
		await boardClient.connect();
		console.log(`boardClient connected ${boardId}`);
		const board = await boardClient.fetchBoard();
		console.log(`${board.title ?? ''} fetched`);

		const userProfiles = extractUserProfiles(configuration.users);
		const userClients = await initializeLoadtestClients(userProfiles.length, urls.websocket, boardId);
		const promises = userProfiles.map((userProfile: UserProfile, index) => {
			const waitTimeMs = index * 500;
			return createUserColumn(userClients[index], index + 1, userProfile, waitTimeMs);
		});

		try {
			const results = await Promise.all([...promises]);
			const sockets = results.map((res) => res.socket);
			const responseTimes = results.flatMap((res) => res.responseTimes);
			const sum = responseTimes.reduce((all, cur) => all + cur.responseTime, 0);
			await boardClient.updateBoardTitle({
				boardId,
				newTitle: `${board.title ?? ''} - ${responseTimes.length} actions (avg response time: ${(
					sum / responseTimes.length
				).toFixed(2)} ms)`,
			});
			boardClient.disconnect();
			await Promise.all(sockets.map((socket) => socket.disconnect()));

			await sleep(2000);

			return results;
		} catch (err) {
			incErrorCount();
			console.error(err);
		}
		return [];
	};

	const writeProtocol = (json: Record<string, unknown>) => {
		const { startDateTime } = json;
		writeFileSync(`${startDateTime as string}_${Math.ceil(Math.random() * 1000)}.json`, JSON.stringify(json, null, 2));
	};

	let intervalHandle: NodeJS.Timeout | undefined;
	const startTime = performance.now();
	const showStats = () => {
		const seconds = Math.ceil((performance.now() - startTime) / 1000);
		const clients = getClientCount();
		const errors = getErrorCount();
		console.log(`${seconds}s - ${clients} clients connected - ${errors} errors`);
	};
	const startRegularStats = () => {
		intervalHandle = setInterval(showStats, 5000);
	};

	const stopRegularStats = () => {
		if (intervalHandle) {
			clearInterval(intervalHandle);
		}
		showStats();
	};

	const runConfigurations = async ({
		target,
		courseId,
		configurations,
	}: {
		target?: string;
		courseId: string;
		configurations: ClassDefinitionWithAmount[];
	}) => {
		const startDateTime = formatDate(new Date());
		const urls = getUrlConfiguration(target);
		const classes = createSeveralClasses(configurations);
		const boardIds = await createBoards(urls.api, courseId, classes.length);
		startRegularStats();
		const promises = classes.flatMap((conf, index) => runBoardTest(boardIds[index], conf, urls));
		const results = flatten(await Promise.all(promises));
		const { responseTimes, errors } = results.reduce(
			(all: { responseTimes: ResponseTimeRecord[]; errors: string[] }, cur) => {
				all.responseTimes.push(...cur.responseTimes);
				all.errors.push(...cur.errors);
				return all;
			},
			{ responseTimes: [], errors: [] } as { responseTimes: ResponseTimeRecord[]; errors: string[] }
		);
		const endDateTime = formatDate(new Date());
		stopRegularStats();
		const protocol = {
			startDateTime,
			endDateTime,
			target,
			courseId,
			configurations,
			responseTimes: getStats(responseTimes),
			errorCount: errors.length,
			errors,
		};
		writeProtocol(protocol);
		console.log(JSON.stringify(protocol, null, 2));
	};

	it('should run a basic load test', async () => {
		const { courseId, token, target } = process.env;
		const viewerClassesAmount = process.env.viewerClasses ? parseInt(process.env.viewerClasses, 10) : 20;
		const collabClassesAmount = process.env.collabClasses ? parseInt(process.env.collabClasses, 10) : 0;
		if (courseId && token && target) {
			await runConfigurations({
				target: target ?? 'http://localhost:4450',
				courseId,
				configurations: [
					{ classDefinition: viewersClass, amount: viewerClassesAmount },
					{ classDefinition: collaborativeClass, amount: collabClassesAmount },
				],
			});
		} else {
			expect('this should only be ran manually').toBeTruthy();
		}
	}, 600000);
});
