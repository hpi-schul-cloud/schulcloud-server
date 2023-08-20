import { InternalServerErrorException } from '@nestjs/common';
import { EntityId, TeamEntity } from '@shared/domain';
import { TeamsRepo } from '@shared/repo';
import { Team } from '../domain';
import { TeamMapper } from './mapper/team.mapper';

export class TeamService {
	constructor(private readonly teamsRepo: TeamsRepo) {}

	public async findByUserId(userId: EntityId): Promise<Team[]> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const teamsPromise: TeamEntity[] = await this.teamsRepo.findByUserId(userId);

		const teams: Team[] = TeamMapper.mapToDOs(teamsPromise);

		return teams;
	}

	public async deleteUserDataFromTeams(userId: EntityId): Promise<number> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const teams = await this.findByUserId(userId);

		const teamsEntity = TeamMapper.mapToEntities(teams);

		const updatedTeams: TeamEntity[] = teamsEntity.map((team: TeamEntity) => {
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
