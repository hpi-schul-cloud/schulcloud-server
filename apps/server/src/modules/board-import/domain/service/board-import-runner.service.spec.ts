import { boardImportJobFactory } from '../../testing';
import { BoardImportRunnerService } from './board-import-runner.service';

describe(BoardImportRunnerService.name, () => {
	describe('run', () => {
		describe('when a job is given', () => {
			const setup = () => {
				const service = new BoardImportRunnerService();
				const job = boardImportJobFactory.build();
				const { signal } = new AbortController();

				return { service, job, signal };
			};

			it('should resolve', async () => {
				const { service, job, signal } = setup();

				await expect(service.run(job, signal)).resolves.toBeUndefined();
			});
		});
	});
});
