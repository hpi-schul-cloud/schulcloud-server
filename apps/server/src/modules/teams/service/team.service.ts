import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { TeamEntity } from '@shared/domain/entity';
import { DeletionService, DomainDeletionReport } from '@shared/domain/interface';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { EntityId } from '@shared/domain/types';
import { TeamsRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { UserDeletedEvent } from '@src/modules/deletion/event';
import { DataDeletedEvent } from '@src/modules/deletion/event/data-deleted.event';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DomainName,
	DomainDeletionReportBuilder,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletionDomainOperationLoggable,
	StatusModel,
} from '@modules/deletion';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class TeamService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly teamsRepo: TeamsRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(TeamService.name);
	}

	async handle({ deletionRequest }: UserDeletedEvent) {
		const dataDeleted = await this.deleteUserData(deletionRequest.targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequest, dataDeleted));
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamsRepo.findByUserId(userId);

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
		const teams = await this.teamsRepo.findByUserId(userId);

		teams.forEach((team) => {
			team.userIds = team.userIds.filter((u) => u.userId.id !== userId);
		});

		await this.teamsRepo.save(teams);

		const numberOfUpdatedTeams = teams.length;

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
