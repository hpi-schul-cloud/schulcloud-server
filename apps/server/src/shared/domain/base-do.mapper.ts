import { InternalServerErrorException } from '@nestjs/common';
import { BaseDO2, BaseDOProps } from './base.do';
import { BaseEntity } from './entity';
/*
// https://stackoverflow.com/questions/52856496/typescript-object-keys-return-string
// https://www.reddit.com/r/typescript/comments/kfjhku/is_a_type_safe_version_of_objectkeys_possible/

const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;

export class RelationTable<
	T extends BaseDOProps,
	DomainObject extends BaseDO2<T>,
	Entity extends BaseEntityWithTimestamps
> {
	private entityKeys: (keyof Entity)[];

	private domainKeys: (keyof T)[];

	constructor(domainObject: DomainObject, entity: Entity, relations: Record<keyof T, keyof Entity>) {
		const props = domainObject.getProps();
		const domainKeys = getKeys(props);
		const entityKeys = Object.values(relations);

		this.validateRelations(domainKeys, entity, relations);

		// this.relations = relations;
		this.entityKeys = entityKeys;
		this.domainKeys = domainKeys;
	}

	public getEntityKey(domainObjectKey: keyof T): keyof Entity {
		const index = this.domainKeys.indexOf(domainObjectKey);
		const entityKey = this.entityKeys[index];

		return entityKey;
	}

	public getDomainKey(entityKey: keyof Entity): keyof T {
		const index = this.entityKeys.indexOf(entityKey);
		const domainKey = this.domainKeys[index];

		return domainKey;
	}

	private validateRelations(keys: (keyof T)[], entity: Entity, relations: Record<keyof T, keyof Entity>): void {
		keys.forEach((key) => {
			this.checkKey(relations, key);
			const entityKey = relations[key];
			this.checkKeyisInEntity(entity, entityKey);
		});
	}

	private checkKey(relations: Record<keyof T, keyof Entity>, domainObjectKey: keyof T): void {
		if (!relations[domainObjectKey]) {
			throw new Error(`Missing key mapping must be implemented ${domainObjectKey as string}`);
		}
	}

	private checkKeyisInEntity(entity: Entity, entityKey: keyof Entity): void {
		if (!entity[entityKey]) {
			throw new Error(`Key do not exists in entity ${entityKey as string}`);
		}
	}
}
*/
export abstract class BaseDOMapper<T extends BaseDOProps, DomainObject extends BaseDO2<T>, Entity extends BaseEntity> {
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

	static getValidProps<R extends BaseDOProps>(domainObject: BaseDO2<R>, entity: BaseEntity): R {
		let props: R;
		if (domainObject.id === entity.id) {
			props = domainObject.getProps();
		} else {
			throw new InternalServerErrorException('BaseDOMapper: id do not match');
		}

		return props;
	}
}
