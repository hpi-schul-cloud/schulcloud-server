import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from '../board-import.config';
import { BoardImportJobService, BoardImportSourceService } from '../domain';
import { boardImportJobFactory } from '../testing';
import { BoardImportUc } from './board-import.uc';

describe(BoardImportUc.name, () => {
	let module: TestingModule;
	let uc: BoardImportUc;
	let boardImportJobService: DeepMocked<BoardImportJobService>;
	let boardImportSourceService: DeepMocked<BoardImportSourceService>;
	let config: BoardImportPublicApiConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportUc,
				{
					provide: BoardImportJobService,
					useValue: createMock<BoardImportJobService>(),
				},
				{
					provide: BoardImportSourceService,
					useValue: createMock<BoardImportSourceService>(),
				},
				{
					provide: BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN,
					useValue: new BoardImportPublicApiConfig(),
				},
			],
		}).compile();

		uc = module.get(BoardImportUc);
		boardImportJobService = module.get(BoardImportJobService);
		boardImportSourceService = module.get(BoardImportSourceService);
		config = module.get(BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('startImport', () => {
		describe('when the feature is disabled', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				config.featureBoardImportEnabled = false;

				return { job };
			};

			it('should throw a feature disabled exception', async () => {
				const { job } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});

			it('should not create a job', async () => {
				const { job } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow();

				expect(boardImportJobService.create).not.toHaveBeenCalled();
			});
		});

		describe('when the service creates a job', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				config.featureBoardImportEnabled = true;

				boardImportSourceService.resolveSource.mockReturnValueOnce(job.source);
				boardImportJobService.create.mockResolvedValueOnce(job);

				return { job };
			};

			it('should create the job for the user, the link and the target', async () => {
				const { job } = setup();

				await uc.startImport(job.userId, job.source.link, job.target);

				expect(boardImportJobService.create).toHaveBeenCalledWith(job.userId, job.source, job.target);
			});

			it('should return the job', async () => {
				const { job } = setup();

				const result = await uc.startImport(job.userId, job.source.link, job.target);

				expect(result).toBe(job);
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
