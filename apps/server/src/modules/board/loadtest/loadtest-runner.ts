import { Injectable } from '@nestjs/common';
import { writeFileSync } from 'node:fs';
import { BoardLoadTest } from './board-load-test';
import { createSeveralClasses } from './helper/class-definitions';
import { createBoardsResilient } from './helper/create-board';
import { formatDate } from './helper/format-date';
import { getUrlConfiguration } from './helper/get-url-configuration';
import { useResponseTimes } from './helper/response-times.composable';
import { SocketConnectionManager } from './socket-connection-manager';
import { Callback, ClassDefinitionWithAmount, CreateBoardLoadTest, SocketConfiguration } from './types';

const { getAvgByAction, getTotalAvg } = useResponseTimes();
type Protocol = {
	protocolFilename: string;
	startDateTime: string;
	endDateTime: string;
	courseId: string;
	socketConfiguration: SocketConfiguration;
	configurations: ClassDefinitionWithAmount[];
	responseTimes: {
		totalAvg: string;
		[key: string]: string;
	};
	errorCount: number;
	errors: string[];
};

@Injectable()
export class LoadtestRunner {
	private intervalHandle: NodeJS.Timeout | undefined;

	private readonly startTime: number;

	private readonly startDate: Date;

	private readonly errors: string[] = [];

	constructor(
		private readonly socketConnectionManager: SocketConnectionManager,
		private readonly createBoardLoadTest: CreateBoardLoadTest
	) {
		this.startTime = performance.now();
		this.startDate = new Date();
	}

	showStats(): void {
		const seconds = Math.ceil((performance.now() - this.startTime) / 1000);
		const clients = this.socketConnectionManager.getClientCount();
		const errors = this.getErrorCount();

		// check how much the event loop is blocked
		const time = process.hrtime();
		process.nextTick(() => {
			/* istanbul ignore next */
			const diff = process.hrtime(time);
			/* istanbul ignore next */
			const ms = diff[0] * 1e9 + diff[1] / 1000000;
			/* istanbul ignore next */
			const eventloopBlockMs = ms.toFixed(2);

			// output the stats (after determining the event loop block time)
			/* istanbul ignore next */
			process.stdout.write(
				`${seconds}s - ${clients} clients connected - ${errors} errors | blocking: ${eventloopBlockMs}ms`
			);
		});
	}

	startRegularStats = (): void => {
		this.intervalHandle = setInterval(() => this.showStats(), 2000);
	};

	stopRegularStats = (): void => {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}
		this.showStats();
	};

	onError: Callback = (message: unknown): void => {
		this.errors.push(message as string);
	};

	private createProtocol(
		courseId: string,
		socketConfiguration: SocketConfiguration,
		configurations: ClassDefinitionWithAmount[]
	): Protocol {
		const protocolFilename = `${formatDate(this.startDate)}_${Math.ceil(Math.random() * 1000)}.loadtest.json`;
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
		writeFileSync(protocolFilename, JSON.stringify(protocol, null, 2));
		process.stdout.write(JSON.stringify(protocol, null, 2));

		return protocol;
	}

	getErrorCount = (): number => this.errors.length;

	async runLoadtest({
		socketConfiguration,
		courseId,
		configurations,
	}: {
		socketConfiguration: SocketConfiguration;
		courseId: string;
		configurations: ClassDefinitionWithAmount[];
	}): Promise<void> {
		const urls = getUrlConfiguration(socketConfiguration.baseUrl);
		const classes = createSeveralClasses(configurations);

		this.startRegularStats();

		const boardIds = await createBoardsResilient(urls.api, socketConfiguration.token, courseId, classes.length).catch(
			(err) => {
				/* istanbul ignore next */
				this.stopRegularStats();
				/* istanbul ignore next */
				throw err;
			}
		);

		if (boardIds.length !== classes.length) {
			/* istanbul ignore next */
			throw new Error('Failed to create all boards');
		}

		const boardLoadTests: BoardLoadTest[] = [];
		for (const classDefinition of classes) {
			const boardLoadTest = this.createBoardLoadTest(this.socketConnectionManager, classDefinition, this.onError);
			const boardId = boardIds[boardLoadTests.length];
			await boardLoadTest.initializeLoadtestClients(boardId);
			boardLoadTests.push(boardLoadTest);
		}

		const promises: Promise<unknown>[] = boardLoadTests.map((boardLoadTest) => boardLoadTest.runBoardTest());

		await Promise.all(promises);

		this.stopRegularStats();

		this.createProtocol(courseId, socketConfiguration, configurations);
	}
}
