import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { userDoFactory } from '@modules/user/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ExternalToolPseudonymEntity } from '../entity';
import { PSEUDONYM_CONFIG_TOKEN } from '../pseudonym.config';
import { ExternalToolPseudonymRepo, Pseudonym } from '../repo';
import { pseudonymFactory } from '../testing';
import { PseudonymService } from './pseudonym.service';

describe('PseudonymService', () => {
	let module: TestingModule;
	let service: PseudonymService;

	let externalToolPseudonymRepo: DeepMocked<ExternalToolPseudonymRepo>;

	beforeAll(async () => {
		await setupEntities([ExternalToolPseudonymEntity]);

		module = await Test.createTestingModule({
			providers: [
				PseudonymService,
				{
					provide: ExternalToolPseudonymRepo,
					useValue: createMock<ExternalToolPseudonymRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: PSEUDONYM_CONFIG_TOKEN,
					useValue: {
						hostUrl: 'https://host.de',
					},
				},
			],
		}).compile();

		service = module.get(PseudonymService);
		externalToolPseudonymRepo = module.get(ExternalToolPseudonymRepo);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserAndToolOrThrow', () => {
		describe('when user or tool is missing', () => {
			const setup = () => {
				const user = userDoFactory.build({ id: undefined });
				const externalTool = externalToolFactory.build({ id: undefined });

				return {
					user,
					externalTool,
				};
			};

			it('should throw an error', async () => {
				const { user, externalTool } = setup();

				await expect(service.findByUserAndToolOrThrow(user, externalTool)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});

		describe('when tool parameter is an ExternalTool', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				return {
					user,
					externalTool,
				};
			};

			it('should call externalToolPseudonymRepo', async () => {
				const { user, externalTool } = setup();

				await service.findByUserAndToolOrThrow(user, externalTool);

				expect(externalToolPseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, externalTool.id);
			});
		});

		describe('when searching by userId and toolId', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolIdOrFail.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalTool,
				};
			};

			it('should call pseudonymRepo.findByUserIdAndToolId', async () => {
				const { user, externalTool } = setup();

				await service.findByUserAndToolOrThrow(user, externalTool);

				expect(externalToolPseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, externalTool.id);
			});

			it('should return a pseudonym', async () => {
				const { pseudonym, user, externalTool } = setup();

				const result = await service.findByUserAndToolOrThrow(user, externalTool);

				expect(result).toEqual(pseudonym);
			});
		});

		describe('when the repo throws an error', () => {
			const setup = () => {
				externalToolPseudonymRepo.findByUserIdAndToolIdOrFail.mockRejectedValueOnce(new NotFoundException());
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				return {
					user,
					externalTool,
				};
			};

			it('should pass the error without catching', async () => {
				const { user, externalTool } = setup();

				const func = async () => service.findByUserAndToolOrThrow(user, externalTool);

				await expect(func).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('findOrCreatePseudonym', () => {
		describe('when user or tool is missing', () => {
			const setup = () => {
				const user = userDoFactory.build({ id: undefined });
				const externalTool = externalToolFactory.build({ id: undefined });

				return {
					user,
					externalTool,
				};
			};

			it('should throw an error', async () => {
				const { user, externalTool } = setup();

				await expect(service.findOrCreatePseudonym(user, externalTool)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});

		describe('when tool parameter is an ExternalToolDO', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				return {
					user,
					externalTool,
				};
			};

			it('should call externalToolPseudonymRepo', async () => {
				const { user, externalTool } = setup();

				await service.findOrCreatePseudonym(user, externalTool);

				expect(externalToolPseudonymRepo.findByUserIdAndToolId).toHaveBeenCalledWith(user.id, externalTool.id);
			});
		});

		describe('when the pseudonym exists', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolId.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalTool,
				};
			};

			it('should return the pseudonym', async () => {
				const { pseudonym, user, externalTool } = setup();

				const result = await service.findOrCreatePseudonym(user, externalTool);

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
				const pseudonym = pseudonymFactory.build();
				const user = userDoFactory.buildWithId();
				const externalTool = externalToolFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolId.mockResolvedValueOnce(null);
				externalToolPseudonymRepo.createOrUpdate.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalTool,
				};
			};

			it('should create and save a new pseudonym', async () => {
				const { user, externalTool } = setup();

				await service.findOrCreatePseudonym(user, externalTool);

				expect(externalToolPseudonymRepo.createOrUpdate).toHaveBeenCalledWith(
					expect.objectContaining({
						userId: user.id,
						toolId: externalTool.id,
					})
				);
			});

			it('should return the pseudonym', async () => {
				const { pseudonym, user, externalTool } = setup();

				const result = await service.findOrCreatePseudonym(user, externalTool);

				expect(result).toEqual<Pseudonym>(pseudonym);
			});
		});
	});

	describe('findByUserId', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user = userDoFactory.build({ id: undefined });

				return {
					user,
				};
			};

			it('should throw an error', async () => {
				const { user } = setup();

				await expect(service.findByUserId(user.id as string)).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when searching by userId', () => {
			const setup = () => {
				const user1 = userDoFactory.buildWithId();
				const pseudonym1 = pseudonymFactory.build({ userId: user1.id });
				const pseudonym2 = pseudonymFactory.build({ userId: user1.id });

				externalToolPseudonymRepo.findByUserId.mockResolvedValue([pseudonym1, pseudonym2]);

				return {
					user1,
					pseudonym1,
					pseudonym2,
				};
			};

			it('should call pseudonymRepo and externalToolPseudonymRepo', async () => {
				const { user1 } = setup();

				await service.findByUserId(user1.id as string);

				expect(externalToolPseudonymRepo.findByUserId).toHaveBeenCalledWith(user1.id);
			});

			it('should be return array with four pseudonyms', async () => {
				const { user1, pseudonym1, pseudonym2 } = setup();

				const result = await service.findByUserId(user1.id as string);

				expect(result).toHaveLength(2);
				expect(result[0].id).toEqual(pseudonym1.id);
				expect(result[0].userId).toEqual(pseudonym1.userId);
				expect(result[0].pseudonym).toEqual(pseudonym1.pseudonym);
				expect(result[0].toolId).toEqual(pseudonym1.toolId);
				expect(result[0].createdAt).toEqual(pseudonym1.createdAt);
				expect(result[0].updatedAt).toEqual(pseudonym1.updatedAt);
				expect(result[1].id).toEqual(pseudonym2.id);
				expect(result[1].userId).toEqual(pseudonym2.userId);
				expect(result[1].pseudonym).toEqual(pseudonym2.pseudonym);
				expect(result[1].toolId).toEqual(pseudonym2.toolId);
				expect(result[1].createdAt).toEqual(pseudonym2.createdAt);
				expect(result[1].updatedAt).toEqual(pseudonym2.updatedAt);
			});
		});

		describe('should return empty array when there is no pseudonym', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				externalToolPseudonymRepo.findByUserId.mockResolvedValueOnce([]);

				return {
					user,
				};
			};

			it('should return empty array', async () => {
				const { user } = setup();

				const result = await service.findByUserId(user.id as string);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('findPseudonymByPseudonym', () => {
		describe('when pseudonym is missing', () => {
			const setup = () => {
				externalToolPseudonymRepo.findPseudonymByPseudonym.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();

				const result = await service.findPseudonymByPseudonym('pseudonym');

				expect(result).toBeNull();
			});
		});

		describe('when pseudonym is found', () => {
			const setup = () => {
				const pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

				externalToolPseudonymRepo.findPseudonymByPseudonym.mockResolvedValue(pseudonym);

				return {
					pseudonym,
				};
			};

			it('should call pseudonymRepo', async () => {
				const { pseudonym } = setup();

				await service.findPseudonymByPseudonym(pseudonym.pseudonym);

				expect(externalToolPseudonymRepo.findPseudonymByPseudonym).toHaveBeenCalledWith(pseudonym.pseudonym);
			});

			it('should return the pseudonym', async () => {
				const { pseudonym } = setup();

				const result = await service.findPseudonymByPseudonym(pseudonym.pseudonym);

				expect(result).toBeDefined();
			});
		});
	});

	describe('findPseudonym', () => {
		describe('when query and params are given', () => {
			const setup = () => {
				const query = {
					pseudonym: 'pseudonym',
				};
				const options: IFindOptions<Pseudonym> = {};
				const page = new Page<Pseudonym>([pseudonymFactory.build()], 1);

				externalToolPseudonymRepo.findPseudonym.mockResolvedValueOnce(page);

				return {
					query,
					options,
					page,
				};
			};

			it('should call service with query and params', async () => {
				const { query, options } = setup();

				await service.findPseudonym(query, options);

				expect(externalToolPseudonymRepo.findPseudonym).toHaveBeenCalledWith(query, options);
			});

			it('should return page with pseudonyms', async () => {
				const { query, options, page } = setup();

				const pseudonymPage = await service.findPseudonym(query, options);

				expect(pseudonymPage).toEqual<Page<Pseudonym>>({
					data: [page.data[0]],
					total: page.total,
				});
			});
		});
	});

	describe('getIframeSubject', () => {
		describe('when pseudonym is given', () => {
			const setup = () => {
				const pseudonym = 'pseudonym';
				const host = 'https://host.de';

				return {
					pseudonym,
					host,
				};
			};

			it('should return the iframeSubject', () => {
				const { pseudonym, host } = setup();

				const result = service.getIframeSubject(pseudonym);

				expect(result).toEqual(
					`<iframe src="${host}/oauth2/username/${pseudonym}" title="username" style="height: 26px; width: 180px; border: none;"></iframe>`
				);
			});
		});
	});
});
