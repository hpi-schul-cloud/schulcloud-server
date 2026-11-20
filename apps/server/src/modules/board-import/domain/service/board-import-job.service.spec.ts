import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { boardImportJobFactory } from '../../testing';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus } from '../type';
import { BoardImportJobService } from './board-import-job.service';

describe(BoardImportJobService.name, () => {
	let module: TestingModule;
	let service: BoardImportJobService;
	let repo: DeepMocked<BoardImportJobRepo>;
	let config: BoardImportConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportJobService,
				{
					provide: BOARD_IMPORT_JOB_REPO,
					useValue: createMock<BoardImportJobRepo>(),
				},
				{
					provide: BOARD_IMPORT_CONFIG_TOKEN,
					useValue: new BoardImportConfig(),
				},
			],
		}).compile();

		service = module.get(BoardImportJobService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		config = module.get(BOARD_IMPORT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.useRealTimers();
	});

	describe('create', () => {
		describe('when save resolves', () => {
			const setup = () => {
				const now = new Date('2026-01-01T00:00:00.000Z');
				jest.useFakeTimers({ now });

				const { userId, link } = boardImportJobFactory.build();
				const status = BoardImportJobStatus.WAITING;
				const expiresAt = new Date(now.getTime() + config.jobRetentionInDays * 24 * 60 * 60 * 1000);

				repo.save.mockImplementationOnce((job: BoardImportJob) => Promise.resolve(job));

				return { userId, link, status, expiresAt };
			};

			it('should save a waiting job that expires after the retention time', async () => {
				const { userId, link, status, expiresAt } = setup();

				const job = await service.create(userId, link);

				expect(repo.save).toHaveBeenCalledWith(job);
				expect(job.getProps()).toEqual({ id: expect.any(String), userId, link, status, expiresAt });
			});
		});

		describe('when save rejects', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();
				const error = new Error('save failed');

				repo.save.mockRejectedValueOnce(error);

				return { userId, link, error };
			};

			it('should pass the error', async () => {
				const { userId, link, error } = setup();

				await expect(service.create(userId, link)).rejects.toThrow(error);
			});
		});
	});

	describe('findById', () => {
		describe('when findById resolves', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				repo.findById.mockResolvedValueOnce(job);

				return { job };
			};

			it('should return the job', async () => {
				const { job } = setup();

				const result = await service.findById(job.id);

				expect(repo.findById).toHaveBeenCalledWith(job.id);
				expect(result).toBe(job);
			});
		});
	});
});
