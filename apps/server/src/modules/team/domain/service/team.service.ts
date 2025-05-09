import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamEntity, TeamRepo } from '../../repo';

@Injectable()
export class TeamService {
	constructor(private readonly teamRepo: TeamRepo, private readonly logger: Logger) {
		this.logger.setContext(TeamService.name);
	}

	public async findUserDataFromTeams(userId: EntityId): Promise<TeamEntity[]> {
		const teams = await this.teamRepo.findByUserId(userId);

		return teams;
	}
}
