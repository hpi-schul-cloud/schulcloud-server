import { TeamUserEntity } from '@shared/domain';

import { TeamUser } from '../../domain';

export class TeamUserMapper {
	private static mapToDO(entity: TeamUserEntity): TeamUser {
		return new TeamUser({
			user: entity.user,
			role: entity.role,
			school: entity.school,
		});
	}

	static mapToDOs(entities: TeamUserEntity[]): TeamUser[] {
		return entities.map((entity) => this.mapToDO(entity));
	}
}
