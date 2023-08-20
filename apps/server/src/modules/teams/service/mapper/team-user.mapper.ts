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

	private static mapToEntity(object: TeamUser): TeamUserEntity {
		return new TeamUserEntity({
			user: object.user,
			role: object.role,
			school: object.school,
		});
	}

	static mapToDOs(entities: TeamUserEntity[]): TeamUser[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(objects: TeamUser[]): TeamUserEntity[] {
		return objects.map((object) => this.mapToEntity(object));
	}
}
