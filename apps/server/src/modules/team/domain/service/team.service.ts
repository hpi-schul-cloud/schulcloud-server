import { Logger } from '@core/logger';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { TeamEntity, TeamRepo } from '../../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class TeamService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly teamRepo: TeamRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(TeamService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamRepo.findByUserId(userId);

		return teams;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Teams',
				DomainName.TEAMS,
				userId,
				StatusModel.PENDING
			)
		);
		const teams = await this.teamRepo.findByUserId(userId);

		const numberOfUpdatedTeams = await this.teamRepo.removeUserReferences(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.TEAMS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, numberOfUpdatedTeams, this.getTeamsId(teams)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Teams',
				DomainName.TEAMS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedTeams,
				0
			)
		);

		return result;
	}

	private getTeamsId(teams: TeamEntity[]): EntityId[] {
		return teams.map((team) => team.id);
	}
}
