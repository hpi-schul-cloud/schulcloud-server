import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { boardImportJobFactory } from '../../testing';
import { type BoardImportJob } from '../do';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportJobStatus } from '../type';
import { BoardImportJobService } from './board-import-job.service';

describe(BoardImportJobService.name, () => {
	let module: TestingModule;
	let service: BoardImportJobService;
	let repo: DeepMocked<BoardImportJobRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportJobService,
				{
					provide: BOARD_IMPORT_JOB_REPO,
					useValue: createMock<BoardImportJobRepo>(),
				},
			],
		}).compile();

		service = module.get(BoardImportJobService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('create', () => {
		describe('when save resolves', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();

				repo.save.mockImplementationOnce((job: BoardImportJob) => Promise.resolve(job));

				return { userId, link };
			};

			it('should save a waiting job', async () => {
				const { userId, link } = setup();

				const job = await service.create(userId, link);

				expect(repo.save).toHaveBeenCalledWith(job);
				expect(job.getProps()).toMatchObject({ userId, link, status: BoardImportJobStatus.WAITING });
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

	describe('save', () => {
		describe('when save resolves', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				repo.save.mockResolvedValueOnce(job);

				return { job };
			};

			it('should return the saved job', async () => {
				const { job } = setup();

				const result = await service.save(job);

				expect(repo.save).toHaveBeenCalledWith(job);
				expect(result).toBe(job);
			});
		});
	});
});
