import { InternalServerErrorException } from '@nestjs/common';
import { BaseDO2, BaseDOProps } from './base.do';
import { BaseEntityWithTimestamps } from './entity';

export abstract class BaseDOMapper<T extends BaseDOProps, DomainObject extends BaseDO2<T>> {
	abstract entityToDO(entity: BaseEntityWithTimestamps): DomainObject;

	abstract mergeDOintoEntity(domainObject: DomainObject, entity: BaseEntityWithTimestamps): void;

	public entitiesToDOs(entities: BaseEntityWithTimestamps[]): DomainObject[] {
		const domainObjects = entities.map((fileRecordEntity) => this.entityToDO(fileRecordEntity));

		return domainObjects;
	}

	public mergeDOsIntoEntities(domainObjects: DomainObject[], entities: BaseEntityWithTimestamps[]): void {
		domainObjects.forEach((domainObject) => {
			const entity = entities.find((e) => e.id === domainObject.id);
			if (entity) {
				this.mergeDOintoEntity(domainObject, entity);
			} else {
				throw new InternalServerErrorException('BaseDOMapper: id not found.');
			}
		});
	}

	public getValidProps(domainObject: BaseDO2<T>, entity: BaseEntityWithTimestamps): T {
		let props: T;
		if (domainObject.id === entity.id) {
			props = domainObject.getProps();
		} else {
			throw new InternalServerErrorException('BaseDOMapper: id do not match');
		}

		return props;
	}
}
