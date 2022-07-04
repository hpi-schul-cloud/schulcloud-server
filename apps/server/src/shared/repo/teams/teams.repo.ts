import { Injectable } from '@nestjs/common';
import { EntityId, Team } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class TeamsRepo extends BaseRepo<Team> {
	get entityName() {
		return Team;
	}

	cacheExpiration = 60000;

	async findById(id: EntityId, populate = false): Promise<Team> {
		const team = await this._em.findOneOrFail(Team, { id }, { cache: this.cacheExpiration });

		if (populate) {
			await this._em.populate(team, ['userIds.role']);
		}

		return team;
	}
}
