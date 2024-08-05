/* eslint-disable no-await-in-loop */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-process-env */
import { writeFileSync } from 'fs';
import { flatten } from 'lodash';
import { ColumnResponse } from '../controller/dto';
import { createLoadtestClient } from './loadtestClientFactory';
import { createBoards, getToken } from './helper/createBoards';
import { UserProfile, UrlConfiguration, ResponseTimeRecord, ClassDefinition } from './types';
import { getUrlConfiguration } from './helper/getUrlConfiguration';
import { getRandomCardTitle, getRandomLink, getRandomRichContentBody } from './helper/randomData';
import { viewersClass, createSeveralClasses, duplicateUserProfiles } from './helper/classDefinitions';
import { getStats, getSummaryText } from './helper/responseTimes';
import { formatDate } from './helper/formatDate';

describe('Board Collaboration Load Test', () => {
	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const createRandomElement = async (socket: ReturnType<typeof createLoadtestClient>, cardId: string) => {
		if (Math.random() > 0.5) {
			await socket.createAndUpdateLinkElement(cardId, getRandomLink());
		} else {
			await socket.createAndUpdateTextElement(cardId, getRandomRichContentBody());
		}
	};

	const createRandomCard = async (
		socket: ReturnType<typeof createLoadtestClient>,
		column: ColumnResponse,
		pauseMs = 1000
	) => {
		const card = await socket.createCard({ columnId: column.id });
		await socket.fetchCard({ cardIds: [card.id] });
		await sleep(pauseMs);
		await socket.updateCardTitle({ cardId: card.id, newTitle: getRandomCardTitle() });
		await sleep(pauseMs);
		for (let i = 0; i < Math.ceil(Math.random() * 5); i += 1) {
			await createRandomElement(socket, card.id);
			await sleep(pauseMs);
		}
	};

	const createCards = async (
		socket: ReturnType<typeof createLoadtestClient>,
		column: ColumnResponse,
		userProfile: UserProfile
	) => {
		const errors: Array<string> = [];
		for (let i = 0; i < userProfile.maxCards; i += 1) {
			try {
				await createRandomCard(socket, column, userProfile.sleepMs);
			} catch (err) {
				errors.push((err as Error).message);
			}
		}
		return errors;
	};

	const createSummaryCard = async (socket: ReturnType<typeof createLoadtestClient>, column: ColumnResponse) => {
		const responseTimes = socket.getResponseTimes();
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

	const createUserColumn = async (position: number, target: string, boardId: string, userProfile: UserProfile) => {
		await sleep(Math.ceil(Math.random() * 10000));
		const socket = createLoadtestClient(target, boardId, getToken());
		let responseTimes: Array<ResponseTimeRecord> = [];
		let errors: Array<string> = [];
		if (userProfile.maxCards > 0) {
			const column = await socket.createColumn();
			try {
				await socket.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte` });
			} catch (err) {
				errors.push((err as Error).message);
			}
			errors = await createCards(socket, column, userProfile);
			try {
				await socket.updateColumnTitle({ columnId: column.id, newTitle: `${position}. Spalte (fertig)` });
			} catch (err) {
				errors.push((err as Error).message);
			}
			responseTimes = await createSummaryCard(socket, column);
		}
		return { socket, responseTimes, errors };
	};

	const runBoardTest = async (boardId: string, configuration: ClassDefinition, urls: UrlConfiguration) => {
		const userProfiles = duplicateUserProfiles(configuration.users);
		const boardSocket = createLoadtestClient(urls.websocket, boardId, getToken());
		const board = await boardSocket.fetchBoard();
		const promises = userProfiles.map((userProfile: UserProfile, index) =>
			createUserColumn(index + 1, urls.websocket, boardId, userProfile)
		);

		try {
			const results = await Promise.all([...promises]);
			const sockets = results.map((res) => res.socket);
			const responseTimes = results.flatMap((res) => res.responseTimes);
			const sum = responseTimes.reduce((all, cur) => all + cur.responseTime, 0);
			await boardSocket.updateBoardTitle({
				boardId,
				newTitle: `${board.title ?? ''} - ${responseTimes.length} requests (avg response time: ${(
					sum / responseTimes.length
				).toFixed(2)} ms)`,
			});
			boardSocket.disconnect();
			await Promise.all(sockets.map((socket) => socket.disconnect()));

			await sleep(2000);

			return results;
		} catch (err) {
			console.error(err);
		}
		return [];
	};

	const writeProtocol = (json: Record<string, unknown>) => {
		const { startTime } = json;
		writeFileSync(`${startTime as string}_${Math.ceil(Math.random() * 1000)}.json`, JSON.stringify(json, null, 2));
	};

	const runConfigurations = async ({
		target,
		courseId,
		configurations,
	}: {
		target?: string;
		courseId: string;
		configurations: ClassDefinition[];
	}) => {
		const startTime = formatDate(new Date());
		const urls = getUrlConfiguration(target);
		const boardIds = await createBoards(urls.api, courseId, configurations.length);
		const promises = configurations.flatMap((conf, index) => runBoardTest(boardIds[index], conf, urls));
		const results = flatten(await Promise.all(promises));
		const { responseTimes, errors } = results.reduce(
			(all: { responseTimes: ResponseTimeRecord[]; errors: string[] }, cur) => {
				all.responseTimes.push(...cur.responseTimes);
				all.errors.push(...cur.errors);
				return all;
			},
			{ responseTimes: [], errors: [] } as { responseTimes: ResponseTimeRecord[]; errors: string[] }
		);
		const endTime = formatDate(new Date());
		writeProtocol({ startTime, endTime, configurations, responseTimes: getStats(responseTimes), errors });
	};

	it('should run a basic load test', async () => {
		const { courseId, token, target } = process.env;
		expect(courseId).toBeDefined();
		expect(typeof courseId).toBe('string');
		expect(typeof token).toBe('string');

		if (courseId) {
			await runConfigurations({
				target: target ?? 'http://localhost:4450',
				courseId,
				configurations: [...createSeveralClasses(20, viewersClass)],
			});
		}
	}, 600000);
});
