import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO, Pseudonym, UserDO } from '@shared/domain';
import { externalToolDOFactory, ltiToolDOFactory, pseudonymFactory, userDoFactory } from '@shared/testing/factory';
import { IToolFeatures, ToolFeatures } from '@src/modules/tool/tool-config';
import { ExternalToolDO } from '@src/modules/tool/external-tool/domain';
import { PseudonymService } from './pseudonym.service';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from '../repo';

describe('PseudonymService', () => {
	let module: TestingModule;
	let service: PseudonymService;

	let pseudonymRepo: DeepMocked<PseudonymsRepo>;
	let externalToolPseudonymRepo: DeepMocked<ExternalToolPseudonymRepo>;
	let toolFeatures: IToolFeatures;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PseudonymService,
				{
					provide: ToolFeatures,
					useValue: {
						ctlToolsTabEnabled: true,
					},
				},
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
				{
					provide: ExternalToolPseudonymRepo,
					useValue: createMock<ExternalToolPseudonymRepo>(),
				},
			],
		}).compile();

		service = module.get(PseudonymService);
		toolFeatures = module.get(ToolFeatures);
		pseudonymRepo = module.get(PseudonymsRepo);
		externalToolPseudonymRepo = module.get(ExternalToolPseudonymRepo);
	});

	beforeEach(() => {
		toolFeatures.ctlToolsTabEnabled = true;
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserAndTool', () => {
		describe('when user or tool is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({ id: undefined });

				return {
					user,
					externalToolDO,
				};
			};

			it('should throw an error', async () => {
				const { user, externalToolDO } = setup();

				await expect(service.findByUserAndTool(user, externalToolDO)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});

		describe('when tool parameter is an ExternalToolDO', () => {
			describe('when ctl tools tab feature is enabled', () => {
				const setup = () => {
					const user: UserDO = userDoFactory.buildWithId();
					const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

					return {
						user,
						externalToolDO,
					};
				};

				it('should call externalToolPseudonymRepo', async () => {
					const { user, externalToolDO } = setup();

					await service.findByUserAndTool(user, externalToolDO);

					expect(externalToolPseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(
						user.id,
						externalToolDO.id
					);
				});
			});

			describe('when tools feature ctl tools tab is disabled', () => {
				const setup = () => {
					const user: UserDO = userDoFactory.buildWithId();
					const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

					toolFeatures.ctlToolsTabEnabled = false;

					return {
						user,
						externalToolDO,
					};
				};

				it('should call pseudonymRepo', async () => {
					const { user, externalToolDO } = setup();

					await service.findByUserAndTool(user, externalToolDO);

					expect(pseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, externalToolDO.id);
				});
			});
		});

		describe('when tool parameter is an LtiToolDO', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const ltiToolDO: LtiToolDO = ltiToolDOFactory.buildWithId();

				return {
					user,
					ltiToolDO,
				};
			};

			it('should call pseudonymRepo', async () => {
				const { user, ltiToolDO } = setup();

				await service.findByUserAndTool(user, ltiToolDO);

				expect(pseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, ltiToolDO.id);
			});
		});

		describe('when searching by userId and toolId', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolIdOrFail.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalToolDO,
				};
			};

			it('should call pseudonymRepo.findByUserIdAndToolId', async () => {
				const { user, externalToolDO } = setup();

				await service.findByUserAndTool(user, externalToolDO);

				expect(externalToolPseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, externalToolDO.id);
			});

			it('should return a pseudonym', async () => {
				const { pseudonym, user, externalToolDO } = setup();

				const result: Pseudonym = await service.findByUserAndTool(user, externalToolDO);

				expect(result).toEqual(pseudonym);
			});
		});

		describe('when the repo throws an error', () => {
			const setup = () => {
				externalToolPseudonymRepo.findByUserIdAndToolIdOrFail.mockRejectedValueOnce(new NotFoundException());
				const user: UserDO = userDoFactory.buildWithId();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				return {
					user,
					externalToolDO,
				};
			};

			it('should pass the error without catching', async () => {
				const { user, externalToolDO } = setup();

				const func = async () => service.findByUserAndTool(user, externalToolDO);

				await expect(func).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('findOrCreatePseudonym', () => {
		describe('when user or tool is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({ id: undefined });

				return {
					user,
					externalToolDO,
				};
			};

			it('should throw an error', async () => {
				const { user, externalToolDO } = setup();

				await expect(service.findOrCreatePseudonym(user, externalToolDO)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});

		describe('when tool parameter is an ExternalToolDO', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				return {
					user,
					externalToolDO,
				};
			};

			it('should call externalToolPseudonymRepo', async () => {
				const { user, externalToolDO } = setup();

				await service.findOrCreatePseudonym(user, externalToolDO);

				expect(externalToolPseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith(user.id, externalToolDO.id);
			});
		});

		describe('when tool parameter is an LtiToolDO', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const ltiToolDO: LtiToolDO = ltiToolDOFactory.buildWithId();

				return {
					user,
					ltiToolDO,
				};
			};

			it('should call pseudonymRepo', async () => {
				const { user, ltiToolDO } = setup();

				await service.findOrCreatePseudonym(user, ltiToolDO);

				expect(pseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith(user.id, ltiToolDO.id);
			});
		});

		describe('when the pseudonym exists', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolId.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalToolDO,
				};
			};

			it('should return the pseudonym', async () => {
				const { pseudonym, user, externalToolDO } = setup();

				const result: Pseudonym = await service.findOrCreatePseudonym(user, externalToolDO);

				expect(result.id).toEqual(pseudonym.id);
				expect(result.toolId).toEqual(pseudonym.toolId);
				expect(result.userId).toEqual(pseudonym.userId);
				expect(result.pseudonym).toEqual(pseudonym.pseudonym);
				expect(result.createdAt).toBeDefined();
				expect(result.updatedAt).toBeDefined();
			});
		});

		describe('when no pseudonym exists yet', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolId.mockResolvedValueOnce(null);
				externalToolPseudonymRepo.createOrUpdate.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalToolDO,
				};
			};

			it('should create and save a new pseudonym', async () => {
				const { user, externalToolDO } = setup();

				await service.findOrCreatePseudonym(user, externalToolDO);

				expect(externalToolPseudonymRepo.createOrUpdate).toHaveBeenCalledWith(
					expect.objectContaining({
						userId: user.id,
						toolId: externalToolDO.id,
					})
				);
			});

			it('should return the pseudonym', async () => {
				const { pseudonym, user, externalToolDO } = setup();

				const result: Pseudonym = await service.findOrCreatePseudonym(user, externalToolDO);

				expect(result).toEqual<Pseudonym>(pseudonym);
			});
		});
	});
});
