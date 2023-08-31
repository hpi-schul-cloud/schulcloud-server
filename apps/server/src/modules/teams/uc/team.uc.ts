import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { TeamService } from '../service';

@Injectable()
export class TeamUC {
	constructor(private readonly teamService: TeamService) {}

	async deleteUserData(userId: EntityId): Promise<number> {
		const updatedTeams = await this.teamService.deleteUserDataFromTeams(userId);

		return updatedTeams;
	}
}
