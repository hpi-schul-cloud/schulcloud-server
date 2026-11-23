import { boardImportJobFactory } from '../../testing';
import { BoardImportJobStatus } from '../type';
import { BoardImportJob } from './board-import-job';

describe(BoardImportJob.name, () => {
	describe('getters', () => {
		describe('when the job is built', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
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
				};

				expect(result).toEqual(props);
			});
		});
	});

	describe('status', () => {
		describe('when the status is set', () => {
			const setup = () => {
				const job = boardImportJobFactory.build({ status: BoardImportJobStatus.WAITING });
				const status = BoardImportJobStatus.FAILED;

				return { job, status };
			};

			it('should change the status', () => {
				const { job, status } = setup();

				job.status = status;

				expect(job.status).toEqual(status);
			});
		});
	});
});
