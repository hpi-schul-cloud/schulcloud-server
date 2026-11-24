import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { BoardImportJobProducer } from '../../amqp';
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
	let producer: DeepMocked<BoardImportJobProducer>;
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
				{
					provide: BoardImportJobProducer,
					useValue: createMock<BoardImportJobProducer>(),
				},
			],
		}).compile();

		service = module.get(BoardImportJobService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		producer = module.get(BoardImportJobProducer);
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
				expect(job.getProps()).toEqual({ id: expect.any(String), userId, link, status, expiresAt, attempts: 0 });
			});

			it('should publish the id of the job with its expiry date', async () => {
				const { userId, link } = setup();

				const job = await service.create(userId, link);

				expect(producer.publishJob).toHaveBeenCalledWith({ jobId: job.id }, job.expiresAt);
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

			it('should not publish a message', async () => {
				const { userId, link, error } = setup();

				await expect(service.create(userId, link)).rejects.toThrow(error);

				expect(producer.publishJob).not.toHaveBeenCalled();
			});
		});

		describe('when publishJob rejects and the job is still waiting', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();
				const error = new Error('publish failed');

				repo.save.mockImplementationOnce((job: BoardImportJob) => Promise.resolve(job));
				producer.publishJob.mockRejectedValueOnce(error);
				repo.failIfWaiting.mockResolvedValueOnce(true);

				return { userId, link, error };
			};

			it('should set the job to failed and pass the error', async () => {
				const { userId, link, error } = setup();

				await expect(service.create(userId, link)).rejects.toThrow(error);

				expect(repo.failIfWaiting).toHaveBeenCalledWith(expect.any(String));
				expect(repo.findById).not.toHaveBeenCalled();
			});
		});

		describe('when publishJob rejects but a worker took the job', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();
				const startedJob = boardImportJobFactory.build({ status: BoardImportJobStatus.RUNNING, attempts: 1 });

				repo.save.mockImplementationOnce((job: BoardImportJob) => Promise.resolve(job));
				producer.publishJob.mockRejectedValueOnce(new Error('publish failed'));
				repo.failIfWaiting.mockResolvedValueOnce(false);
				repo.findById.mockResolvedValueOnce(startedJob);

				return { userId, link, startedJob };
			};

			it('should return the started job', async () => {
				const { userId, link, startedJob } = setup();

				const result = await service.create(userId, link);

				expect(result).toBe(startedJob);
			});
		});

		describe('when publishJob rejects and the job is not found again', () => {
			const setup = () => {
				const { userId, link } = boardImportJobFactory.build();
				const error = new Error('publish failed');

				repo.save.mockImplementationOnce((job: BoardImportJob) => Promise.resolve(job));
				producer.publishJob.mockRejectedValueOnce(error);
				repo.failIfWaiting.mockResolvedValueOnce(false);
				repo.findById.mockResolvedValueOnce(null);

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
