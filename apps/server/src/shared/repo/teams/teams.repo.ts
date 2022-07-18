import { Injectable } from '@nestjs/common';
import { EntityId, Role, Team } from '@shared/domain';
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
			for (let i = 0; i < team.userIds.length; i += 1) {
				const teamUser = team.userIds[i];
				// eslint-disable-next-line no-await-in-loop
				await this._em.populate(teamUser, ['role']);
				// eslint-disable-next-line no-await-in-loop
				await this.populateRoles([teamUser.role]);
			}
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
