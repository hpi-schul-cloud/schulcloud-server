import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from '../board-import.config';
import { RuntimeConfigService } from '@infra/runtime-config';
import {
	BOARD_IMPORT_SOURCE_SWITCH_KEYS,
	BoardImportJobService,
	BoardImportLinkInvalidLoggableException,
	BoardImportSourceDisabledLoggableException,
	BoardImportSourceService,
	BoardImportSourceUnknownLoggableException,
} from '../domain';
import { boardImportJobFactory } from '../testing';
import { BoardImportUc } from './board-import.uc';

describe(BoardImportUc.name, () => {
	let module: TestingModule;
	let uc: BoardImportUc;
	let boardImportJobService: DeepMocked<BoardImportJobService>;
	let boardImportSourceService: DeepMocked<BoardImportSourceService>;
	let runtimeConfigService: DeepMocked<RuntimeConfigService>;
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
					provide: RuntimeConfigService,
					useValue: createMock<RuntimeConfigService>(),
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
		runtimeConfigService = module.get(RuntimeConfigService);
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

			it('should not check the link, read the switch or create a job', async () => {
				const { job } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow();

				expect(boardImportSourceService.resolveSource).not.toHaveBeenCalled();
				expect(runtimeConfigService.getBoolean).not.toHaveBeenCalled();
				expect(boardImportJobService.create).not.toHaveBeenCalled();
			});
		});

		describe.each([BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException])(
			'when the check of the link throws %p',
			(Exception) => {
				const setup = () => {
					const job = boardImportJobFactory.build();
					const error = new Exception();
					config.featureBoardImportEnabled = true;

					boardImportSourceService.resolveSource.mockImplementationOnce(() => {
						throw error;
					});

					return { job, error };
				};

				it('should throw the same exception', async () => {
					const { job, error } = setup();

					await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toBe(error);
				});

				it('should not read the switch or create a job', async () => {
					const { job } = setup();

					await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow();

					expect(runtimeConfigService.getBoolean).not.toHaveBeenCalled();
					expect(boardImportJobService.create).not.toHaveBeenCalled();
				});
			}
		);

		describe('when the source is switched off', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				config.featureBoardImportEnabled = true;

				boardImportSourceService.resolveSource.mockReturnValueOnce(job.source);
				runtimeConfigService.getBoolean.mockResolvedValueOnce(false);

				return { job };
			};

			it('should throw a source disabled exception', async () => {
				const { job } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow(
					BoardImportSourceDisabledLoggableException
				);
			});

			it('should not create a job', async () => {
				const { job } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow();

				expect(boardImportJobService.create).not.toHaveBeenCalled();
			});
		});

		describe('when the switch cannot be read', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const error = new Error('database not available');
				config.featureBoardImportEnabled = true;

				boardImportSourceService.resolveSource.mockReturnValueOnce(job.source);
				runtimeConfigService.getBoolean.mockRejectedValueOnce(error);

				return { job, error };
			};

			it('should throw the error and not create a job', async () => {
				const { job, error } = setup();

				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toBe(error);

				expect(boardImportJobService.create).not.toHaveBeenCalled();
			});
		});

		describe('when the source is switched on', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				const switchKey = BOARD_IMPORT_SOURCE_SWITCH_KEYS[job.source.type];
				config.featureBoardImportEnabled = true;

				boardImportSourceService.resolveSource.mockReturnValueOnce(job.source);
				runtimeConfigService.getBoolean.mockResolvedValueOnce(true);
				boardImportJobService.create.mockResolvedValueOnce(job);

				return { job, switchKey };
			};

			it('should check the link', async () => {
				const { job } = setup();

				await uc.startImport(job.userId, job.source.link, job.target);

				expect(boardImportSourceService.resolveSource).toHaveBeenCalledWith(job.source.link);
			});

			it('should read the switch of the source', async () => {
				const { job, switchKey } = setup();

				await uc.startImport(job.userId, job.source.link, job.target);

				expect(runtimeConfigService.getBoolean).toHaveBeenCalledWith(switchKey);
			});

			it('should create the job for the user, the source and the target', async () => {
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

		describe('when two imports start one after the other', () => {
			const setup = () => {
				const job = boardImportJobFactory.build();
				config.featureBoardImportEnabled = true;

				boardImportSourceService.resolveSource.mockReturnValueOnce(job.source).mockReturnValueOnce(job.source);
				runtimeConfigService.getBoolean.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
				boardImportJobService.create.mockResolvedValueOnce(job);

				return { job };
			};

			it('should read the switch for each start', async () => {
				const { job } = setup();

				await uc.startImport(job.userId, job.source.link, job.target);
				await expect(uc.startImport(job.userId, job.source.link, job.target)).rejects.toThrow(
					BoardImportSourceDisabledLoggableException
				);

				expect(runtimeConfigService.getBoolean).toHaveBeenCalledTimes(2);
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
