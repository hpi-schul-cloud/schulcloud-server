import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { boardImportJobFactory } from '../testing';
import { BoardImportUc } from '../uc';
import { BoardImportController } from './board-import.controller';

describe(BoardImportController.name, () => {
	let module: TestingModule;
	let controller: BoardImportController;
	let boardImportUc: DeepMocked<BoardImportUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [BoardImportController],
			providers: [
				{
					provide: BoardImportUc,
					useValue: createMock<BoardImportUc>(),
				},
			],
		}).compile();

		controller = module.get(BoardImportController);
		boardImportUc = module.get(BoardImportUc);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('startImport', () => {
		describe('when the use case returns a job', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const job = boardImportJobFactory.build({ userId: currentUser.userId });
				boardImportUc.startImport.mockResolvedValueOnce(job);

				return { currentUser, job };
			};

			it('should start the import for the current user', async () => {
				const { currentUser, job } = setup();

				await controller.startImport({ link: job.link }, currentUser);

				expect(boardImportUc.startImport).toHaveBeenCalledWith(currentUser.userId, job.link);
			});

			it('should return the id and the status of the job', async () => {
				const { currentUser, job } = setup();

				const response = await controller.startImport({ link: job.link }, currentUser);

				expect(response).toEqual({ id: job.id, status: job.status });
			});
		});
	});

	describe('getJob', () => {
		describe('when the use case returns a job', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const job = boardImportJobFactory.build({ userId: currentUser.userId });
				boardImportUc.getJob.mockResolvedValueOnce(job);

				return { currentUser, job };
			};

			it('should get the job for the current user', async () => {
				const { currentUser, job } = setup();

				await controller.getJob({ jobId: job.id }, currentUser);

				expect(boardImportUc.getJob).toHaveBeenCalledWith(currentUser.userId, job.id);
			});

			it('should return the id and the status of the job', async () => {
				const { currentUser, job } = setup();

				const response = await controller.getJob({ jobId: job.id }, currentUser);

				expect(response).toEqual({ id: job.id, status: job.status });
			});
		});
	});
});
