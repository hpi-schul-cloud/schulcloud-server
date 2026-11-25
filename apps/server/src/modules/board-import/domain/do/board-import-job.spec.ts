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
});
