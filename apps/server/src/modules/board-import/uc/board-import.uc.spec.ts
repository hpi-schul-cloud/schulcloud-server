import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BoardImportJobProducer } from '../amqp';
import { BoardImportJobService } from '../domain';
import { boardImportJobFactory } from '../testing';
import { BoardImportUc } from './board-import.uc';

describe(BoardImportUc.name, () => {
	let module: TestingModule;
	let uc: BoardImportUc;
	let boardImportJobService: DeepMocked<BoardImportJobService>;
	let boardImportJobProducer: DeepMocked<BoardImportJobProducer>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportUc,
				{
					provide: BoardImportJobService,
					useValue: createMock<BoardImportJobService>(),
				},
				{
					provide: BoardImportJobProducer,
					useValue: createMock<BoardImportJobProducer>(),
				},
			],
		}).compile();

		uc = module.get(BoardImportUc);
		boardImportJobService = module.get(BoardImportJobService);
		boardImportJobProducer = module.get(BoardImportJobProducer);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('startImport', () => {
		describe('when the service creates a job', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				boardImportJobService.create.mockResolvedValueOnce(job);

				return { job };
			};

			it('should create the job for the user and the link', async () => {
				const { job } = setup();

				await uc.startImport(job.userId, job.link);

				expect(boardImportJobService.create).toHaveBeenCalledWith(job.userId, job.link);
			});

			it('should publish the id of the job', async () => {
				const { job } = setup();

				await uc.startImport(job.userId, job.link);

				expect(boardImportJobProducer.publishJob).toHaveBeenCalledWith({ jobId: job.id });
			});

			it('should return the job', async () => {
				const { job } = setup();

				const result = await uc.startImport(job.userId, job.link);

				expect(result).toBe(job);
			});
		});

		describe('when the service rejects', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const error = new Error('create failed');

				boardImportJobService.create.mockRejectedValueOnce(error);

				return { job, error };
			};

			it('should not publish a message', async () => {
				const { job, error } = setup();

				await expect(uc.startImport(job.userId, job.link)).rejects.toThrow(error);

				expect(boardImportJobProducer.publishJob).not.toHaveBeenCalled();
			});
		});
	});

	describe('getJob', () => {
		describe('when the job belongs to the user', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				boardImportJobService.findById.mockResolvedValueOnce(job);

				return { job };
			};

			it('should return the job', async () => {
				const { job } = setup();

				const result = await uc.getJob(job.userId, job.id);

				expect(boardImportJobService.findById).toHaveBeenCalledWith(job.id);
				expect(result).toBe(job);
			});
		});

		describe('when the job belongs to another user', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const { userId: otherUserId } = boardImportJobFactory.build();

				boardImportJobService.findById.mockResolvedValueOnce(job);

				return { job, otherUserId };
			};

			it('should throw a not found exception', async () => {
				const { job, otherUserId } = setup();

				await expect(uc.getJob(otherUserId, job.id)).rejects.toThrow(NotFoundException);
			});
		});

		describe('when the job does not exist', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();

				boardImportJobService.findById.mockResolvedValueOnce(null);

				return { job };
			};

			it('should throw a not found exception', async () => {
				const { job } = setup();

				await expect(uc.getJob(job.userId, job.id)).rejects.toThrow(NotFoundException);
			});
		});
	});
});
