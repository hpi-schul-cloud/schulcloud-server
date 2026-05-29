import { ErwinIdentifier } from '../../domain/do';
import { ErwinIdentifierEntity } from '../entity';

export class ErwinIdentifierMapper {
	public static mapToDo(entity: ErwinIdentifierEntity): ErwinIdentifier {
		return new ErwinIdentifier({
			id: entity.id,
			erwinId: entity.erwinId,
			type: entity.type,
			referencedEntityId: entity.referencedEntityId,
		});
	}

	public static mapToEntity(domainObject: ErwinIdentifier): ErwinIdentifierEntity {
		return new ErwinIdentifierEntity({
			id: domainObject.id,
			erwinId: domainObject.erwinId,
			type: domainObject.type,
			referencedEntityId: domainObject.referencedEntityId,
		});
	}

	public static mapToDos(entities: ErwinIdentifierEntity[]): ErwinIdentifier[] {
		return entities.map((entity) => this.mapToDo(entity));
	}

	public static mapToEntities(domainObjects: ErwinIdentifier[]): ErwinIdentifierEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
