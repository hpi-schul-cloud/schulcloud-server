import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { teamFactory, teamUserFactory } from '@modules/team/testing';
import { EventBus } from '@nestjs/cqrs/dist';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { TeamEntity, TeamRepo } from '../../repo';
import { TeamService } from './team.service';

describe('TeamService', () => {
	let module: TestingModule;
	let service: TeamService;

	let teamRepo: DeepMocked<TeamRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities([TeamEntity]);

		module = await Test.createTestingModule({
			providers: [
				TeamService,
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
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
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();

		service = module.get(TeamService);
		teamRepo = module.get(TeamRepo);
		eventBus = module.get(EventBus);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findUserDataFromTeams', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const teamUser = teamUserFactory.buildWithId();
				const team1 = teamFactory.withTeamUser([teamUser]).build();
				const team2 = teamFactory.withTeamUser([teamUser]).build();

				teamRepo.findByUserId.mockResolvedValue([team1, team2]);

				return {
					teamUser,
				};
			};

			it('should call teamRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.findUserDataFromTeams(teamUser.user.id);

				expect(teamRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should return array of two teams with user', async () => {
				const { teamUser } = setup();

				const result = await service.findUserDataFromTeams(teamUser.user.id);

				expect(result.length).toEqual(2);
			});
		});
	});

	describe('deleteUserDataFromTeams', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const teamUser = teamUserFactory.buildWithId();
				const team1 = teamFactory.withTeamUser([teamUser]).build();
				const team2 = teamFactory.withTeamUser([teamUser]).build();

				teamRepo.findByUserId.mockResolvedValue([team1, team2]);
				teamRepo.removeUserReferences.mockResolvedValue(2);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.TEAMS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [team1.id, team2.id]),
				]);

				return {
					expectedResult,
					teamUser,
				};
			};

			it('should call teamRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.deleteUserData(teamUser.user.id);

				expect(teamRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should call teamRepo.removeUserReferences', async () => {
				const { teamUser } = setup();

				await service.deleteUserData(teamUser.user.id);

				expect(teamRepo.removeUserReferences).toBeCalledWith(teamUser.user.id);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResult, teamUser } = setup();

				const result = await service.deleteUserData(teamUser.user.id);

				expect(result).toEqual(expectedResult);
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
