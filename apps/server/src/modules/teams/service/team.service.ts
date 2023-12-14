import { Injectable } from '@nestjs/common';
import { TeamEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { TeamsRepo } from '@shared/repo';

@Injectable()
export class TeamService {
	constructor(private readonly teamsRepo: TeamsRepo) {}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamsRepo.findByUserId(userId);

		return teams;
	}

	public async deleteUserDataFromTeams(userId: EntityId): Promise<number> {
		const teams = await this.teamsRepo.findByUserId(userId);

		teams.forEach((team) => {
			team.userIds = team.userIds.filter((u) => u.userId.id !== userId);
		});

		await this.teamsRepo.save(teams);

		return teams.length;
	}
}
