import { Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { TeamEntity } from '@shared/domain/entity';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { TeamsRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class TeamService {
	constructor(private readonly teamsRepo: TeamsRepo, private readonly logger: Logger) {
		this.logger.setContext(TeamService.name);
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamsRepo.findByUserId(userId);

		return teams;
	}

	public async deleteUserDataFromTeams(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Teams',
				DomainModel.TEAMS,
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

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Teams',
				DomainModel.TEAMS,
				userId,
				StatusModel.PENDING,
				numberOfUpdatedTeams,
				0
			)
		);

		return numberOfUpdatedTeams;
	}
}
