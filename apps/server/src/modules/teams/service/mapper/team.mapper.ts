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

	private static mapToEntity(object: Team): TeamEntity {
		return new TeamEntity({
			name: object.name,
			teamUsers: TeamUserMapper.mapToEntities(object.userIds),
		});
	}

	static mapToDOs(entities: TeamEntity[]): Team[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(objects: Team[]): TeamEntity[] {
		return objects.map((object) => this.mapToEntity(object));
	}
}
