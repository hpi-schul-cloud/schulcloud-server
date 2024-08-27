/* eslint-disable no-await-in-loop */
import { writeFileSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { createSeveralClasses } from './helper/class-definitions';
import { createBoardsResilient } from './helper/create-board';
import { formatDate } from './helper/format-date';
import { getUrlConfiguration } from './helper/get-url-configuration';
import { useResponseTimes } from './helper/responseTimes.composable';
import { SocketConnectionManager } from './socket-connection-manager';
import { Callback, ClassDefinitionWithAmount, CreateBoardLoadTest, SocketConfiguration } from './types';

const { getAvgByAction, getTotalAvg } = useResponseTimes();

@Injectable()
export class LoadtestRunner {
	private socketConnectionManager: SocketConnectionManager;

	private intervalHandle: NodeJS.Timeout | undefined;

	private startTime: number;

	private startDate: Date;

	private errors: string[] = [];

	private readonly createBoardLoadTest: CreateBoardLoadTest;

	constructor(socketConnectionManager: SocketConnectionManager, createBoardLoadTest: CreateBoardLoadTest) {
		this.socketConnectionManager = socketConnectionManager;
		this.createBoardLoadTest = createBoardLoadTest;
		this.startTime = performance.now();
		this.startDate = new Date();
	}

	showStats() {
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

	startRegularStats = () => {
		this.intervalHandle = setInterval(() => this.showStats(), 2000);
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

	private createProtocol(
		courseId: string,
		socketConfiguration: SocketConfiguration,
		configurations: ClassDefinitionWithAmount[]
	) {
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

		const boardIds = await createBoardsResilient(urls.api, socketConfiguration.token, courseId, classes.length).catch(
			(err) => {
				this.stopRegularStats();
				throw err;
			}
		);

		if (boardIds.length !== classes.length) {
			throw new Error('Failed to create all boards');
		}

		const promises: Promise<unknown>[] = classes.flatMap(async (classDefinition, index) => {
			const boardLoadTest = this.createBoardLoadTest(this.socketConnectionManager, this.onError);
			const boardId = boardIds[index];
			return boardLoadTest.runBoardTest(boardId, classDefinition);
		});

		await Promise.all(promises);

		this.stopRegularStats();

		this.createProtocol(courseId, socketConfiguration, configurations);
	}
}
