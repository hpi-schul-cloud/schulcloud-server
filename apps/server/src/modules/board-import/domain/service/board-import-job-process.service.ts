import { Logger } from '@infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobLogReason } from '../type';
import { BoardImportRunnerService } from './board-import-runner.service';

const MILLISECONDS_PER_MINUTE = 60 * 1000;

@Injectable()
export class BoardImportJobProcessService {
	constructor(
		@Inject(BOARD_IMPORT_JOB_REPO) private readonly boardImportJobRepo: BoardImportJobRepo,
		@Inject(BOARD_IMPORT_CONFIG_TOKEN) private readonly config: BoardImportConfig,
		private readonly boardImportRunnerService: BoardImportRunnerService,
		private readonly logger: Logger
	) {}

	// Resolves when the job has an end status or needs no work. Rejects when the job must be delivered again.
	public async process(jobId: EntityId): Promise<void> {
		const job = await this.boardImportJobRepo.findById(jobId);

		if (!job) {
			this.logger.warning('Board import job skipped', { jobId, reason: BoardImportJobLogReason.JOB_NOT_FOUND });

			return;
		}

		if (job.isClosed()) {
			this.logSkippedClosedJob(jobId);

			return;
		}

		if (!this.hasAttemptsLeft(job)) {
			await this.fail(job, BoardImportJobLogReason.MAX_ATTEMPTS);

			return;
		}

		const now = new Date();
		const remainingTimeInMs = this.getRemainingTimeInMs(job, now);

		if (remainingTimeInMs <= 0) {
			await this.fail(job, BoardImportJobLogReason.MAX_DURATION);

			return;
		}

		const startedJob = await this.boardImportJobRepo.startAttempt(jobId, now);

		// The import API can set the job to failed between the read and the start.
		if (!startedJob) {
			this.logSkippedClosedJob(jobId);

			return;
		}

		this.logger.info('Board import job started', { jobId, attempts: startedJob.attempts });

		await this.runAndClose(startedJob, remainingTimeInMs);
	}

	private async runAndClose(job: BoardImportJob, remainingTimeInMs: number): Promise<void> {
		let isInTime: boolean;
		try {
			isInTime = await this.runWithTimeLimit(job, remainingTimeInMs);
		} catch (error) {
			if (this.hasAttemptsLeft(job)) {
				throw error;
			}
			await this.fail(job, BoardImportJobLogReason.MAX_ATTEMPTS);

			return;
		}

		if (!isInTime) {
			await this.fail(job, BoardImportJobLogReason.MAX_DURATION);

			return;
		}

		job.finish();
		await this.boardImportJobRepo.save(job);
		this.logger.info('Board import job finished', { jobId: job.id, attempts: job.attempts });
	}

	private logSkippedClosedJob(jobId: EntityId): void {
		this.logger.warning('Board import job skipped', { jobId, reason: BoardImportJobLogReason.JOB_CLOSED });
	}

	private hasAttemptsLeft(job: BoardImportJob): boolean {
		const hasAttemptsLeft = job.attempts < this.config.jobMaxAttempts;

		return hasAttemptsLeft;
	}

	private getRemainingTimeInMs(job: BoardImportJob, now: Date): number {
		const maxDurationInMs = this.config.jobMaxDurationInMinutes * MILLISECONDS_PER_MINUTE;
		const startedAt = job.startedAt ?? now;
		const remainingTimeInMs = startedAt.getTime() + maxDurationInMs - now.getTime();

		return remainingTimeInMs;
	}

	private async runWithTimeLimit(job: BoardImportJob, timeLimitInMs: number): Promise<boolean> {
		const abortController = new AbortController();
		let timer: NodeJS.Timeout | undefined;
		const timeLimit = new Promise<boolean>((resolve) => {
			timer = setTimeout(() => {
				abortController.abort();
				resolve(false);
			}, timeLimitInMs);
		});
		const run = this.boardImportRunnerService.run(job, abortController.signal).then(() => true);

		try {
			const isInTime = await Promise.race([run, timeLimit]);

			return isInTime;
		} finally {
			clearTimeout(timer);
		}
	}

	private async fail(job: BoardImportJob, reason: BoardImportJobLogReason): Promise<void> {
		job.fail();
		await this.boardImportJobRepo.save(job);
		this.logger.warning('Board import job failed', { jobId: job.id, reason, attempts: job.attempts });
	}
}
