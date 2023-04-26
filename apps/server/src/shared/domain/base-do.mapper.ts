import { InternalServerErrorException } from '@nestjs/common';
import { BaseDO2, BaseDOProps } from './base.do';
import { BaseEntityWithTimestamps } from './entity';

export abstract class BaseDOMapper<
	T extends BaseDOProps,
	DomainObject extends BaseDO2<T>,
	Entity extends BaseEntityWithTimestamps
> {
	abstract entityToDO(entity: Entity): DomainObject;

	abstract mergeDOintoEntity(domainObject: DomainObject, entity: Entity): void;

	abstract createEntity(domainObject: DomainObject): Entity;

	public entitiesToDOs(entities: Entity[]): DomainObject[] {
		const domainObjects = entities.map((e) => this.entityToDO(e));

		return domainObjects;
	}

	public createOrMergeintoEntities(domainObjects: DomainObject[], entities: Entity[]): Entity[] {
		domainObjects.forEach((domainObject) => {
			const entity = entities.find((e) => e.id === domainObject.id);
			if (entity) {
				this.mergeDOintoEntity(domainObject, entity);
			} else {
				// throw new InternalServerErrorException('BaseDOMapper: id not found.');
				const newEntity = this.createEntity(domainObject);
				entities.push(newEntity);
			}
		});

		return entities;
	}

	public getValidProps(domainObject: BaseDO2<T>, entity: Entity): T {
		let props: T;
		if (domainObject.id === entity.id) {
			props = domainObject.getProps();
		} else {
			throw new InternalServerErrorException('BaseDOMapper: id do not match');
		}

		return props;
	}
}
