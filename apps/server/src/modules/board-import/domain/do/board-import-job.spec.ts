import { boardImportJobFactory } from '../../testing';
import { BoardImportJobLogReason, BoardImportJobStatus } from '../type';
import { BoardImportJob } from './board-import-job';

describe(BoardImportJob.name, () => {
	describe('getters', () => {
		describe('when the job is built', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({
					startedAt: new Date(),
					failureReason: BoardImportJobLogReason.MAX_ATTEMPTS,
				});
				const props = job.getProps();

				return { job, props };
			};

			it('should return the props of the job', () => {
				const { job, props } = setup();

				const result = {
					id: job.id,
					status: job.status,
					userId: job.userId,
					source: job.source,
					target: job.target,
					expiresAt: job.expiresAt,
					attempts: job.attempts,
					startedAt: job.startedAt,
					notes: job.notes,
					failureReason: job.failureReason,
				};

				expect(result).toEqual(props);
			});
		});
	});

	describe('getDeadline', () => {
		describe('when the job has started', () => {
			const setup = () => {
				const startedAt = new Date('2026-01-01T00:00:00.000Z');
				const now = new Date('2026-01-01T00:10:00.000Z');
				const maxDurationInMs = 25 * 60 * 1000;
				const job = boardImportJobFactory.build({ startedAt });
				const expected = new Date(startedAt.getTime() + maxDurationInMs);

				return { job, now, maxDurationInMs, expected };
			};

			it('should return the first start plus the maximum duration', () => {
				const { job, now, maxDurationInMs, expected } = setup();

				const result = job.getDeadline(maxDurationInMs, now);

				expect(result).toEqual(expected);
			});
		});

		describe('when the job has not started', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:10:00.000Z');
				const maxDurationInMs = 25 * 60 * 1000;
				const job = boardImportJobFactory.build({ startedAt: undefined });
				const expected = new Date(now.getTime() + maxDurationInMs);

				return { job, now, maxDurationInMs, expected };
			};

			it('should return the given time plus the maximum duration', () => {
				const { job, now, maxDurationInMs, expected } = setup();

				const result = job.getDeadline(maxDurationInMs, now);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('isClosed', () => {
		describe.each([
			[BoardImportJobStatus.WAITING, false],
			[BoardImportJobStatus.RUNNING, false],
			[BoardImportJobStatus.FINISHED, true],
			[BoardImportJobStatus.FAILED, true],
		])('when the status is %s', (status, expected) => {
			const setup = () => {
				const job = boardImportJobFactory.build({ status });

				return { job };
			};

			it(`should return ${String(expected)}`, () => {
				const { job } = setup();

				const result = job.isClosed();

				expect(result).toEqual(expected);
			});
		});
	});
});
