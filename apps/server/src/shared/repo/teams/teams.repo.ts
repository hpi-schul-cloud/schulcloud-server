import { Injectable } from '@nestjs/common';
import { EntityId, Role, Team, TeamUser } from '@shared/domain';
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
			await Promise.all<void>(
				team.userIds.map(async (teamUser: TeamUser): Promise<void> => {
					await this._em.populate(teamUser, ['role']);
					await this.populateRoles([teamUser.role]);
				})
			);
		}

		return team;
	}

	private async populateRoles(roles: Role[]): Promise<void[]> {
		return Promise.all<void>(
			roles.map(async (role: Role): Promise<void> => {
				if (!role.roles.isInitialized(true)) {
					await this._em.populate(role, ['roles']);
					await this.populateRoles(role.roles.getItems());
				}
			})
		);
	}
}
