import { TeamEntity } from '@shared/domain';
import { Team } from '../../domain';
import { TeamUserMapper } from './team-user.mapper';

export class TeamMapper {
	private static mapToDO(entity: TeamEntity): Team {
		return new Team({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			name: entity.name,
			userIds: TeamUserMapper.mapToDOs(entity.userIds),
		});
	}

	static mapToDOs(entities: TeamEntity[]): Team[] {
		return entities.map((entity) => this.mapToDO(entity));
	}
}
