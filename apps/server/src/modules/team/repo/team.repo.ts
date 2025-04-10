import { ObjectId } from '@mikro-orm/mongodb';
import { Role } from '@modules/role/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { TeamEntity, TeamUserEntity } from './team.entity';

@Injectable()
export class TeamRepo extends BaseRepo<TeamEntity> {
	get entityName() {
		return TeamEntity;
	}

	async findById(id: EntityId, populate = false): Promise<TeamEntity> {
		const team = await this._em.findOneOrFail(TeamEntity, { id });

		if (populate) {
			await Promise.all<void>(
				team.teamUsers.map(async (teamUser: TeamUserEntity): Promise<void> => {
					await this._em.populate(teamUser, ['role']);
					await this.populateRoles([teamUser.role]);
				})
			);
		}

		return team;
	}

	/**
	 * Finds teams which the user is a member.
	 *
	 * @param userId
	 * @return Array of teams
	 */
	async findByUserId(userId: EntityId): Promise<TeamEntity[]> {
		const teams: TeamEntity[] = await this._em.find<TeamEntity>(TeamEntity, {
			userIds: { userId: new ObjectId(userId) },
		});
		return teams;
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

	public async removeUserReferences(userId: EntityId): Promise<number> {
		const id = new ObjectId(userId);
		const count = await this._em.nativeUpdate(TeamEntity, { userIds: { userId: id } }, {
			$pull: { userIds: { userId: id } },
		} as Partial<TeamEntity>);

		return count;
	}
}
