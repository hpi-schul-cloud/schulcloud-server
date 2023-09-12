import { Injectable } from '@nestjs/common';
import { EntityId, TeamEntity } from '@shared/domain';
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

		const updatedTeams: TeamEntity[] = teams.map((team: TeamEntity) => {
			return {
				...team,
				userIds: team.userIds.filter((u) => u.userId.id !== userId),
				teamUsers: team.userIds.filter((u) => u.userId.id !== userId),
			};
		});

		await this.teamsRepo.save(updatedTeams);

		return updatedTeams.length;
	}
}
