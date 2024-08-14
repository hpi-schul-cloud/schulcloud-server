/* eslint-disable no-await-in-loop */
import { flatten } from 'lodash';
import { createSeveralClasses } from './helper/classDefinitions';
import { createBoard, createBoards } from './helper/createBoards';
import { formatDate } from './helper/formatDate';
import { getUrlConfiguration } from './helper/getUrlConfiguration';
// import { getStats } from './helper/responseTimes';
// import { SocketConnection } from './SocketConnection';
import { SocketConnectionManager } from './SocketConnectionManager';
import { ClassDefinitionWithAmount, SocketConfiguration } from './types';
import { BoardTest } from './board-test';

export class LoadtestRunner {
	private socketConnectionManager: SocketConnectionManager;

	private intervalHandle: NodeJS.Timeout | undefined;

	private startTime: number;

	private startDate: Date;

	constructor(socketConnectionManager: SocketConnectionManager) {
		this.socketConnectionManager = socketConnectionManager;
		this.startTime = performance.now();
		this.startDate = new Date();
	}

	init() {}

	showStats() {
		const seconds = Math.ceil((performance.now() - this.startTime) / 1000);
		const clients = this.socketConnectionManager.getClientCount();
		const errors = 1000; // getErrorCount();
		console.log(`${seconds}s - ${clients} clients connected - ${errors} errors`);
	}

	startRegularStats = () => {
		this.intervalHandle = setInterval(() => this.showStats(), 5000);
	};

	stopRegularStats = () => {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}
		this.showStats();
	};

	async runLoadtest({
		socketConfiguration,
		courseId,
		configurations,
	}: {
		socketConfiguration: SocketConfiguration;
		courseId: string;
		configurations: ClassDefinitionWithAmount[];
	}) {
		const urls = getUrlConfiguration(socketConfiguration.baseUrl);
		const classes = createSeveralClasses(configurations);
		this.startRegularStats();
		const promises: Promise<unknown>[] = classes.flatMap(async (conf) => {
			const boardTest = new BoardTest(this.socketConnectionManager);
			const boardId = await createBoard(urls.api, socketConfiguration.token, courseId);
			return boardTest.runBoardTest(boardId, conf);
		});
		const results = flatten(await Promise.all(promises));
		// const { responseTimes, errors } = results.reduce(
		// 	(all: { responseTimes: ResponseTimeRecord[]; errors: string[] }, cur: ResponseTimeRecord) => {
		// 		all.responseTimes.push(...cur.responseTimes);
		// 		all.errors.push(...cur.errors);
		// 		return all;
		// 	},
		// 	{ responseTimes: [] as ResponseTimeRecord[], errors: [] } as {
		// 		responseTimes: ResponseTimeRecord[];
		// 		errors: string[];
		// 	}
		// );
		console.log(results);
		this.stopRegularStats();

		const protocol = {
			startDateTime: formatDate(this.startDate),
			endDateTime: formatDate(new Date()),
			courseId,
			socketConfiguration,
			configurations,
			// responseTimes: getStats(responseTimes),
			// errorCount: errors.length,
			// errors,
		};
		// writeProtocol(protocol);
		console.log(JSON.stringify(protocol, null, 2));
	}
}
