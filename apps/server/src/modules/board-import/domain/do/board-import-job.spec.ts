import { boardImportJobFactory } from '../../testing';
import { BoardImportJobStatus } from '../type';
import { BoardImportJob } from './board-import-job';

describe(BoardImportJob.name, () => {
	describe('getters', () => {
		describe('when the job is built', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ startedAt: new Date() });
				const props = job.getProps();

				return { job, props };
			};

			it('should return the props of the job', () => {
				const { job, props } = setup();

				const result = {
					id: job.id,
					status: job.status,
					userId: job.userId,
					link: job.link,
					expiresAt: job.expiresAt,
					attempts: job.attempts,
					startedAt: job.startedAt,
				};

				expect(result).toEqual(props);
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

	describe('startAttempt', () => {
		describe('when the job has no attempt', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const now = new Date();
				const status = BoardImportJobStatus.RUNNING;

				return { job, now, status };
			};

			it('should set the status running, count the attempt and set the start time', () => {
				const { job, now, status } = setup();

				job.startAttempt(now);

				expect(job.status).toEqual(status);
				expect(job.attempts).toEqual(1);
				expect(job.startedAt).toEqual(now);
			});
		});

		describe('when the job has an earlier attempt', () => {
			const setup = () => {
				const startedAt = new Date('2026-01-01T00:00:00.000Z');
				const attempts = 1;
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING, attempts, startedAt });
				const now = new Date('2026-01-01T00:05:00.000Z');

				return { job, now, startedAt, attempts };
			};

			it('should count the attempt and keep the start time', () => {
				const { job, now, startedAt, attempts } = setup();

				job.startAttempt(now);

				expect(job.attempts).toEqual(attempts + 1);
				expect(job.startedAt).toEqual(startedAt);
			});
		});
	});

	describe('finish', () => {
		describe('when the job is running', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING });
				const status = BoardImportJobStatus.FINISHED;

				return { job, status };
			};

			it('should set the status finished', () => {
				const { job, status } = setup();

				job.finish();

				expect(job.status).toEqual(status);
			});
		});
	});

	describe('fail', () => {
		describe('when the job is running', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING });
				const status = BoardImportJobStatus.FAILED;

				return { job, status };
			};

			it('should set the status failed', () => {
				const { job, status } = setup();

				job.fail();

				expect(job.status).toEqual(status);
			});
		});
	});
});
