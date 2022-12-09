import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { EntityId, School, System } from '@shared/domain';
import { IdentifiedReference, Reference } from '@mikro-orm/core';

export class SchoolMapper {
	static mapToEntity(schoolDto: SchoolDto): School {
		const school = new School({
			name: schoolDto.name,
			externalId: schoolDto.externalId,
		});

		if (schoolDto.id) {
			school.id = schoolDto.id;
		}

		const refs: IdentifiedReference<System, EntityId>[] = schoolDto.systemIds.map(
			(systemId: EntityId): IdentifiedReference<System, EntityId> => {
				return Reference.createFromPK(System, systemId);
			}
		);
		school.systems.add(...refs);

		return school;
	}

	static mapEntityToEntity(target: School, source: School): School {
		target.name = source.name;
		target.externalId = source.externalId;
		target.systems = source.systems;
		if (source.oauthMigrationPossible) {
			target.oauthMigrationPossible = source.oauthMigrationPossible;
		}
		if (source.oauthMigrationMandatory) {
			target.oauthMigrationMandatory = source.oauthMigrationMandatory;
		}
		return target;
	}

	static mapToDto(entity: School) {
		return new SchoolDto({
			name: entity.name,
			id: entity.id,
			externalId: entity.externalId,
			systemIds: entity.systems.getItems().map((system: System): EntityId => system.id),
		});
	}
}
