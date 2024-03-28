import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory, teamUserFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainDeletionReportBuilder } from '@shared/domain/builder';
import { DomainName, OperationType } from '@shared/domain/types';
import { EventBus } from '@nestjs/cqrs/dist';
import { ObjectId } from 'bson';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletedEvent,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { TeamService } from './team.service';

describe('TeamService', () => {
	let module: TestingModule;
	let service: TeamService;

	let teamsRepo: DeepMocked<TeamsRepo>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TeamService,
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
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

		service = module.get(TeamService);
		teamsRepo = module.get(TeamsRepo);
		eventBus = module.get(EventBus);

		await setupEntities();
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

				teamsRepo.findByUserId.mockResolvedValue([team1, team2]);

				return {
					teamUser,
				};
			};

			it('should call teamsRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.findUserDataFromTeams(teamUser.user.id);

				expect(teamsRepo.findByUserId).toBeCalledWith(teamUser.user.id);
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

				teamsRepo.findByUserId.mockResolvedValue([team1, team2]);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.TEAMS, OperationType.UPDATE, 2, [
					team1.id,
					team2.id,
				const expectedResult = DomainDeletionReportBuilder.build(DomainName.TEAMS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [team1.id, team2.id]),
				]);

				return {
					expectedResult,
					teamUser,
				};
			};

			it('should call teamsRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.deleteUserData(teamUser.user.id);

				expect(teamsRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should update teams without deleted user', async () => {
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
