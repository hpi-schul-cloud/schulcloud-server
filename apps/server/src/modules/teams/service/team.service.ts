import { Injectable } from '@nestjs/common';
import { TeamEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { TeamsRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class TeamService {
	constructor(private readonly teamsRepo: TeamsRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(TeamService.name);
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamsRepo.findByUserId(userId);

		return teams;
	}

	public async deleteUserDataFromTeams(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Deleting users data from Teams for user ', userId });
		const teams = await this.teamsRepo.findByUserId(userId);

		teams.forEach((team) => {
			team.userIds = team.userIds.filter((u) => u.userId.id !== userId);
		});

		await this.teamsRepo.save(teams);

		this.logger.log({ action: 'Deleted users data from Teams for user ', userId });

		return teams.length;
	}
}
