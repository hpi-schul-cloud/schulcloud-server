import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { LtiToolDO, Page, Pseudonym, UserDO } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { ltiToolDOFactory, pseudonymFactory, userDoFactory } from '@shared/testing/factory';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymRepo, PseudonymsRepo } from '../repo';
import { PseudonymService } from './pseudonym.service';

describe('PseudonymService', () => {
	let module: TestingModule;
	let service: PseudonymService;

	let pseudonymRepo: DeepMocked<PseudonymsRepo>;
	let externalToolPseudonymRepo: DeepMocked<ExternalToolPseudonymRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				PseudonymService,
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
				{
					provide: ExternalToolPseudonymRepo,
					useValue: createMock<ExternalToolPseudonymRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get(PseudonymService);
		pseudonymRepo = module.get(PseudonymsRepo);
		externalToolPseudonymRepo = module.get(ExternalToolPseudonymRepo);
		eventBus = module.get(EventBus);
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
				const user: UserDO = userDoFactory.build({ id: undefined });
				const externalTool: ExternalTool = externalToolFactory.build({ id: undefined });

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
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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

		describe('when tool parameter is an LtiTool', () => {
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

				await service.findByUserAndToolOrThrow(user, ltiToolDO);

				expect(pseudonymRepo.findByUserIdAndToolIdOrFail).toHaveBeenCalledWith(user.id, ltiToolDO.id);
			});
		});

		describe('when searching by userId and toolId', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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

				const result: Pseudonym = await service.findByUserAndToolOrThrow(user, externalTool);

				expect(result).toEqual(pseudonym);
			});
		});

		describe('when the repo throws an error', () => {
			const setup = () => {
				externalToolPseudonymRepo.findByUserIdAndToolIdOrFail.mockRejectedValueOnce(new NotFoundException());
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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
				const user: UserDO = userDoFactory.build({ id: undefined });
				const externalTool: ExternalTool = externalToolFactory.build({ id: undefined });

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
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				externalToolPseudonymRepo.findByUserIdAndToolId.mockResolvedValueOnce(pseudonym);

				return {
					pseudonym,
					user,
					externalTool,
				};
			};

			it('should return the pseudonym', async () => {
				const { pseudonym, user, externalTool } = setup();

				const result: Pseudonym = await service.findOrCreatePseudonym(user, externalTool);

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
				const pseudonym: Pseudonym = pseudonymFactory.build();
				const user: UserDO = userDoFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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

				const result: Pseudonym = await service.findOrCreatePseudonym(user, externalTool);

				expect(result).toEqual<Pseudonym>(pseudonym);
			});
		});
	});

	describe('findByUserId', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });

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
				const user1: UserDO = userDoFactory.buildWithId();
				const pseudonym1: Pseudonym = pseudonymFactory.build({ userId: user1.id });
				const pseudonym2: Pseudonym = pseudonymFactory.build({ userId: user1.id });
				const pseudonym3: Pseudonym = pseudonymFactory.build({ userId: user1.id });
				const pseudonym4: Pseudonym = pseudonymFactory.build({ userId: user1.id });

				pseudonymRepo.findByUserId.mockResolvedValue([pseudonym1, pseudonym2]);
				externalToolPseudonymRepo.findByUserId.mockResolvedValue([pseudonym3, pseudonym4]);

				return {
					user1,
					pseudonym1,
					pseudonym2,
					pseudonym3,
					pseudonym4,
				};
			};

			it('should call pseudonymRepo and externalToolPseudonymRepo', async () => {
				const { user1 } = setup();

				await service.findByUserId(user1.id as string);

				expect(pseudonymRepo.findByUserId).toHaveBeenCalledWith(user1.id);
				expect(externalToolPseudonymRepo.findByUserId).toHaveBeenCalledWith(user1.id);
			});

			it('should be return array with four pseudonyms', async () => {
				const { user1, pseudonym1, pseudonym2, pseudonym3, pseudonym4 } = setup();

				const result: Pseudonym[] = await service.findByUserId(user1.id as string);

				expect(result).toHaveLength(4);
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
				expect(result[2].id).toEqual(pseudonym3.id);
				expect(result[2].userId).toEqual(pseudonym3.userId);
				expect(result[2].pseudonym).toEqual(pseudonym3.pseudonym);
				expect(result[2].toolId).toEqual(pseudonym3.toolId);
				expect(result[2].createdAt).toEqual(pseudonym3.createdAt);
				expect(result[2].updatedAt).toEqual(pseudonym3.updatedAt);
				expect(result[3].id).toEqual(pseudonym4.id);
				expect(result[3].userId).toEqual(pseudonym4.userId);
				expect(result[3].pseudonym).toEqual(pseudonym4.pseudonym);
				expect(result[3].toolId).toEqual(pseudonym4.toolId);
				expect(result[3].createdAt).toEqual(pseudonym4.createdAt);
				expect(result[3].updatedAt).toEqual(pseudonym4.updatedAt);
			});
		});

		describe('should return empty array when there is no pseudonym', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();

				return {
					user,
				};
			};
			it('should return empty array', async () => {
				const { user } = setup();

				const result: Pseudonym[] = await service.findByUserId(user.id as string);

				expect(result).toHaveLength(0);
			});
		});
	});

	describe('deleteUserData', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });

				return {
					user,
				};
			};

			it('should throw an error', async () => {
				const { user } = setup();

				await expect(service.deleteUserData(user.id as string)).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when deleting by userId', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const pseudonymsDeleted = [new ObjectId().toHexString(), new ObjectId().toHexString()];
				const externalPseudonymsDeleted = [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				];

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.PSEUDONYMS, [
					DomainOperationReportBuilder.build(
						OperationType.DELETE,
						pseudonymsDeleted.length + externalPseudonymsDeleted.length,
						[...pseudonymsDeleted, ...externalPseudonymsDeleted]
					),
				]);

				pseudonymRepo.deletePseudonymsByUserId.mockResolvedValue(pseudonymsDeleted);
				externalToolPseudonymRepo.deletePseudonymsByUserId.mockResolvedValue(externalPseudonymsDeleted);

				return {
					expectedResult,
					user,
				};
			};

			it('should delete pseudonyms by userId', async () => {
				const { expectedResult, user } = setup();

				const result = await service.deleteUserData(user.id as string);

				expect(result).toEqual(expectedResult);
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

				const result: Pseudonym | null = await service.findPseudonymByPseudonym('pseudonym');

				expect(result).toBeNull();
			});
		});

		describe('when pseudonym is found', () => {
			const setup = () => {
				const pseudonym: Pseudonym = pseudonymFactory.build({ pseudonym: 'pseudonym' });

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

				const result: Pseudonym | null = await service.findPseudonymByPseudonym(pseudonym.pseudonym);

				expect(result).toBeDefined();
			});
		});
	});

	describe('findPseudonym', () => {
		describe('when query and params are given', () => {
			const setup = () => {
				const query: PseudonymSearchQuery = {
					pseudonym: 'pseudonym',
				};
				const options: IFindOptions<Pseudonym> = {};
				const page: Page<Pseudonym> = new Page<Pseudonym>([pseudonymFactory.build()], 1);

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

				const pseudonymPage: Page<Pseudonym> = await service.findPseudonym(query, options);

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
				Configuration.set('HOST', host);

				return {
					pseudonym,
					host,
				};
			};

			it('should return the iframeSubject', () => {
				const { pseudonym, host } = setup();

				const result: string = service.getIframeSubject(pseudonym);

				expect(result).toEqual(
					`<iframe src="${host}/oauth2/username/${pseudonym}" title="username" style="height: 26px; width: 180px; border: none;"></iframe>`
				);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in classService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await service.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
