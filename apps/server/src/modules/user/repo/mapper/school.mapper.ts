import { School as SchoolEntity } from '@shared/domain';

export class SchoolMapper {
	static mapToDO(entity: SchoolEntity): School {
		return new School({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			email: entity.email,
		});
	}

	static mapToEntity(domainObject: School): SchoolEntity {
		return new SchoolEntity({});
	}

	static mapToDOs(entities: SchoolEntity[]): School[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: School[]): SchoolEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
