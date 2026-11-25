import { Logger } from '@infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError, BoardImportJobUnreadableError } from '../error';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobLogReason, BoardImportJobStatus } from '../type';
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
		let job: BoardImportJob | null;
		try {
			job = await this.boardImportJobRepo.findById(jobId);
		} catch (error) {
			if (error instanceof BoardImportJobUnreadableError) {
				// A redelivery cannot repair the stored job, so it fails at once and the queue goes on.
				await this.failUnreadable(jobId);

				return;
			}
			throw error;
		}

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
			if (error instanceof BoardImportJobRejectedError) {
				await this.fail(job, error.reason);

				return;
			}
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

		const isClosed = await this.boardImportJobRepo.closeAttempt(job.id, job.attempts, BoardImportJobStatus.FINISHED);
		if (!isClosed) {
			this.logSkippedOutdatedAttempt(job);

			return;
		}
		this.logger.info('Board import job finished', { jobId: job.id, attempts: job.attempts });
	}

	private logSkippedOutdatedAttempt(job: BoardImportJob): void {
		this.logger.warning('Board import job end status not stored', {
			jobId: job.id,
			reason: BoardImportJobLogReason.OUTDATED_ATTEMPT,
			attempts: job.attempts,
		});
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
		const remainingTimeInMs = job.getDeadline(maxDurationInMs, now).getTime() - now.getTime();

		return remainingTimeInMs;
	}

	private async runWithTimeLimit(job: BoardImportJob, timeLimitInMs: number): Promise<boolean> {
		const abortController = new AbortController();
		let timer: NodeJS.Timeout | undefined;
		const timeLimit = new Promise<boolean>((resolve) => {
			timer = setTimeout(() => resolve(false), timeLimitInMs);
		});

		try {
			const run = this.boardImportRunnerService.run(job, abortController.signal).then(() => true);
			const isInTime = await Promise.race([run, timeLimit]);

			return isInTime;
		} finally {
			clearTimeout(timer);
			// Stops the steps that still run after a timeout or after another step failed.
			abortController.abort();
		}
	}

	private async failUnreadable(jobId: EntityId): Promise<void> {
		const isFailed = await this.boardImportJobRepo.failIfOpen(jobId);
		if (!isFailed) {
			this.logSkippedClosedJob(jobId);

			return;
		}
		this.logger.warning('Board import job failed', { jobId, reason: BoardImportJobLogReason.JOB_UNREADABLE });
	}

	private async fail(job: BoardImportJob, reason: BoardImportJobLogReason): Promise<void> {
		const isClosed = await this.boardImportJobRepo.closeAttempt(job.id, job.attempts, BoardImportJobStatus.FAILED);
		if (!isClosed) {
			this.logSkippedOutdatedAttempt(job);

			return;
		}
		this.logger.warning('Board import job failed', {
			jobId: job.id,
			userId: job.userId,
			reason,
			attempts: job.attempts,
		});
	}
}
