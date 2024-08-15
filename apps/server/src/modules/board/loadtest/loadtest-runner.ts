/* eslint-disable no-await-in-loop */
import { writeFileSync } from 'fs';
import { BoardTest } from './board-test';
import { createSeveralClasses } from './helper/class-definitions';
import { createBoard } from './helper/create-board';
import { formatDate } from './helper/format-date';
import { getUrlConfiguration } from './helper/get-url-configuration';
import { useResponseTimes } from './helper/responseTimes.composable';
import { SocketConnectionManager } from './socket-connection-manager';
import { Callback, ClassDefinitionWithAmount, ResponseTimeRecord, SocketConfiguration } from './types';

const { getAvgByAction, getTotalAvg } = useResponseTimes();
export class LoadtestRunner {
	private socketConnectionManager: SocketConnectionManager;

	private intervalHandle: NodeJS.Timeout | undefined;

	private startTime: number;

	private startDate: Date;

	private errors: string[] = [];

	private responseTimes: ResponseTimeRecord[] = [];

	constructor(socketConnectionManager: SocketConnectionManager) {
		this.socketConnectionManager = socketConnectionManager;
		this.startTime = performance.now();
		this.startDate = new Date();
	}

	showStats() {
		const seconds = Math.ceil((performance.now() - this.startTime) / 1000);
		const clients = this.socketConnectionManager.getClientCount();
		const errors = this.getErrorCount();
		const time = process.hrtime();
		process.nextTick(() => {
			const diff = process.hrtime(time);
			const ms = diff[0] * 1e9 + diff[1] / 1000000;
			const eventloopBlockMs = ms.toFixed(2);
			console.log(`${seconds}s - ${clients} clients connected - ${errors} errors | blocking: ${eventloopBlockMs}ms`);
		});
	}

	startRegularStats = () => {
		this.intervalHandle = setInterval(() => this.showStats(), 10000);
	};

	stopRegularStats = () => {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}
		this.showStats();
	};

	onError: Callback = (message: unknown) => {
		this.errors.push(message as string);
	};

	onResponseTime: Callback = (action: unknown, responseTime: unknown) => {
		if (typeof responseTime === 'number' && typeof action === 'string') {
			this.responseTimes.push({ action, responseTime });
		} else {
			throw new Error('Invalid response time');
		}
	};

	private createProtocol(
		courseId: string,
		socketConfiguration: SocketConfiguration,
		configurations: ClassDefinitionWithAmount[]
	) {
		const protocolFilename = `${formatDate(this.startDate)}_${Math.ceil(Math.random() * 1000)}.json`;
		const protocol = {
			protocolFilename,
			startDateTime: formatDate(this.startDate),
			endDateTime: formatDate(new Date()),
			courseId,
			socketConfiguration,
			configurations,
			responseTimes: {
				...getAvgByAction(),
				totalAvg: getTotalAvg(),
			},
			errorCount: this.errors.length,
			errors: this.errors,
		};

		return protocol;
	}

	private showProtocol(protocol: { protocolFilename: string }) {
		console.log(JSON.stringify(protocol, null, 2));
	}

	private writeProtocol(json: { protocolFilename: string }) {
		writeFileSync(json.protocolFilename, JSON.stringify(json, null, 2));
	}

	private handleProtocol = (
		courseId: string,
		socketConfiguration: SocketConfiguration,
		configurations: ClassDefinitionWithAmount[]
	) => {
		const protocol = this.createProtocol(courseId, socketConfiguration, configurations);
		this.writeProtocol(protocol);
		this.showProtocol(protocol);
	};

	getErrorCount = () => this.errors.length;

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
			const boardTest = new BoardTest(this.socketConnectionManager, this.onError);
			const boardId = await createBoard(urls.api, socketConfiguration.token, courseId);
			return boardTest.runBoardTest(boardId, conf);
		});

		await Promise.all(promises);

		this.stopRegularStats();

		this.handleProtocol(courseId, socketConfiguration, configurations);
	}
}
