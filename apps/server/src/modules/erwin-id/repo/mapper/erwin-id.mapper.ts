import { ErwinId } from '../../domain/do';
import { ErwinIdEntity } from '../entity';

export class ErwinIdMapper {
	public static mapToDO(entity: ErwinIdEntity): ErwinId {
		return new ErwinId({
			id: entity.id,
			erwinId: entity.erwinId,
			type: entity.type,
			erwinIdReferencedEntityId: entity.erwinIdReferencedEntityId,
		});
	}

	public static mapToEntity(domainObject: ErwinId): ErwinIdEntity {
		return new ErwinIdEntity({
			id: domainObject.id,
			erwinId: domainObject.erwinId,
			type: domainObject.type,
			erwinIdReferencedEntityId: domainObject.erwinIdReferencedEntityId,
		});
	}

	public static mapToDOs(entities: ErwinIdEntity[]): ErwinId[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	public static mapToEntities(domainObjects: ErwinId[]): ErwinIdEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
