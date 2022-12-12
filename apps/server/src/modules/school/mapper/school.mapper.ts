import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { EntityId, School, System } from '@shared/domain';
import { IdentifiedReference, Reference } from '@mikro-orm/core';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

export class SchoolMapper {
	static mapToDO(schoolDto: SchoolDto): SchoolDO {
		const school = new SchoolDO({
			name: schoolDto.name,
			externalId: schoolDto.externalId,
		});

		if (schoolDto.id) {
			school.id = schoolDto.id;
		}

		/* const refs: IdentifiedReference<System, EntityId>[] = schoolDto.systemIds.map(
			(systemId: EntityId): IdentifiedReference<System, EntityId> => {
				return Reference.createFromPK(System, systemId);
			}
		);
		school.systems.add(...refs); */
		school.systems = schoolDto.systemIds;

		return school;
	}

	static mapEntityToEntity(target: School, source: School): School {
		target.name = source.name;
		target.externalId = source.externalId;
		target.systems = source.systems;

		return target;
	}

	static mapToDto(entity: SchoolDO) {
		return new SchoolDto({
			name: entity.name,
			id: entity.id,
			externalId: entity.externalId,
			// systemIds: entity.systems.getItems().map((system: System): EntityId => system.id),
			systemIds: entity.systems as string[],
		});
	}
}
