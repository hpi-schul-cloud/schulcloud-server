import { Injectable } from '@nestjs/common';
import { EntityId, Role, Team, TeamUser } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class TeamsRepo extends BaseRepo<Team> {
	get entityName() {
		return Team;
	}

	cacheExpiration = 60000;

	async findById(id: EntityId, populate = true): Promise<Team> {
		const team = await this._em.findOneOrFail(Team, { id }, { cache: this.cacheExpiration });

		if (populate) {
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			team.userIds.forEach(async (teamUser: TeamUser) => {
				await this._em.populate(teamUser, ['role']);
				await this.populateRoles([teamUser.role]);
			});
		}

		return team;
	}

	private async populateRoles(roles: Role[]): Promise<void> {
		for (let i = 0; i < roles.length; i += 1) {
			const role = roles[i];
			if (!role.roles.isInitialized(true)) {
				// eslint-disable-next-line no-await-in-loop
				await this._em.populate(role, ['roles']);
				// eslint-disable-next-line no-await-in-loop
				await this.populateRoles(role.roles.getItems());
			}
		}
	}
}
