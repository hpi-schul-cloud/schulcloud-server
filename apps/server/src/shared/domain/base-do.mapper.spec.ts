import { Entity, Collection, MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { BaseDOMapper } from './base-do.mapper';
import { BaseDO2, BaseDOProps } from './base.do';
import { BaseEntity } from './entity';
import { EntityId } from './types';

interface EntityCProps {
	// no optional id
	keyC: string;
}
@Entity()
class EntityC extends BaseEntity {
	keyC: string;

	constructor(props: EntityCProps) {
		super();
		this.keyC = props.keyC;
	}
}

class EntityCFactory {
	static build(entityProps: EntityCProps): EntityC {
		return new EntityC(entityProps);
	}

	// mutations vs void?
	static merge(sourceEntity: EntityC, partial: Partial<EntityCProps>): EntityC {
		const props: EntityCProps = {
			keyC: partial.keyC || sourceEntity.keyC,
		};

		const mergedEntity = EntityCFactory.build(props);

		return mergedEntity;
	}
}

interface EntityBProps {
	id?: EntityId;
	keyA: string;
	keyB: string;
}
@Entity()
class EntityB extends BaseEntity {
	keyA: string; // exists also in A

	keyB: string;

	constructor(props: EntityBProps) {
		super();
		this.keyA = props.keyA;
		this.keyB = props.keyB;
	}
}

interface EntityAProps {
	id?: EntityId;
	keyA: string;
	keyEmbedded?: EntityC;
	keyArray?: EntityC[];
	additionalRequiredKey: number;
	additionalOptionalKey?: number;
}
@Entity()
class EntityA extends BaseEntity {
	keyA: string;

	keyEmbedded?: EntityC;

	keyArray = new Collection<EntityC>(this);

	additionalRequiredKey: number;

	additionalOptionalKey?: number;

	constructor(props: EntityAProps) {
		super();

		this.keyA = props.keyA;
		this.keyEmbedded = props.keyEmbedded;
		this.keyArray.set(props.keyArray || []);
		this.additionalRequiredKey = props.additionalRequiredKey;
		this.additionalOptionalKey = props.additionalOptionalKey;
	}
}

interface UserProps extends BaseDOProps {
	firstName: string;
}

interface UserListProps extends BaseDOProps {
	lastName: string;
}

interface DoAProps extends BaseDOProps {
	nameA: string;
	userA?: UserProps;
	usersA: UserListProps[];
}
class DoA extends BaseDO2<DoAProps> {}

interface DoBProps extends BaseDOProps {
	id: EntityId;
	keyA: string;
	keyB: string;
}
class DoB extends BaseDO2<DoBProps> {}

interface DoCProps extends BaseDOProps {
	id: EntityId;
	keyC: string;
}
class DoC extends BaseDO2<DoCProps> {}

const getId = () => new ObjectId().toHexString();

describe('base-do.mapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([EntityA, EntityB, EntityC]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when one entity resolve in one domain object', () => {
		class TestMapper extends BaseDOMapper<DoAProps, DoA, EntityA> {
			// required
			createEntity(domainObject: DoA): EntityA {
				const props = domainObject.getProps();
				// NOTE:
				// important it is not possible to add a creation if not all entity required props exists in do, or can added on this place.
				// This requirement exists also for each embeeded entity in or out of collections.
				const entity = new EntityA({
					keyA: props.nameA,
					additionalRequiredKey: 7, // <-- key is unkown in domain object
				});
				entity.id = domainObject.id;

				return entity;
			}

			// NOTE: EntityC must be knowen on this place
			// optional to realise deeper mappings
			createUserProps(entity: EntityC): UserProps {
				const props: UserProps = {
					id: entity.id,
					firstName: entity.keyC,
				};

				return props;
			}

			// optional to realise deeper mappings
			createUserListProps(entity: EntityC): UserListProps {
				const props: UserListProps = {
					id: entity.id,
					lastName: entity.keyC,
				};

				return props;
			}

			// required
			entityToDO(entity: EntityA): DoA {
				const usersEntities = entity.keyArray.getItems();
				const usersA = usersEntities.map((user) => this.createUserListProps(user));
				const userA = entity.keyEmbedded ? this.createUserProps(entity.keyEmbedded) : undefined;

				const doAProps: DoAProps = {
					id: entity.id,
					nameA: entity.keyA,
					userA,
					usersA,
				};
				// NOTE: please use factories for production code instead of new
				const domainObject = new DoA(doAProps);

				return domainObject;
			}

			// required
			mergeDOintoEntity(domainObject: DoA, entity: EntityA): void {
				const props = TestMapper.getValidProps(domainObject, entity);
				if (props.userA) {
					// NOTE: over this way a new on can be added, but no exists can be modified
					// If you want modified a exist you must be create a mapper that extends BaseDOMapper, or import a alredy existing
					entity.keyEmbedded = new EntityC({
						keyC: props.userA.firstName,
					});
					entity.keyEmbedded.id = props.userA.id;
				}
				// Das macht kein Sinn, wir brauchen eine entity factory bei der man die entity + partials rein geben kann.
				// Das new würde bei jeden key der nicht mit gegeben wird abhängig von dem in constrcutor hinterlegten, manchmal richtiges, manchmal falsches mapping hervor rufen
				const userEntities = entity.keyArray.getItems();
				const users = props.usersA.map((user) => {
					const findSubEntity = userEntities.find((e) => e.id === user.id);
					let mergedOrCreatedEntity: EntityC; // ..................Was genau der code ist, der in einem mapper der BaseDOMapper extended eh vorhanden wäre...
					if (findSubEntity) {
						mergedOrCreatedEntity = EntityCFactory.merge(findSubEntity, { keyC: user.lastName });
					} else {
						mergedOrCreatedEntity = EntityCFactory.build({ keyC: user.lastName }); // vermutlich möchte man gar keine sub entities
					}

					return mergedOrCreatedEntity;
				});


			}
		}

		const setup = () => {
			const mapper = new TestMapper();
			const user = new EntityC({ keyC: 'a' });
			const users = [new EntityC({ keyC: 'b' }), new EntityC({ keyC: 'c' }), new EntityC({ keyC: 'd' })];
			user.id = getId();
			users[0].id = getId();
			users[1].id = getId();
			users[2].id = getId();
			const nameA = 'test';
			const id = getId();

			const doA = new DoA({
				nameA,
				id,
				userA: { firstName: user.keyC, id: user.id },
				usersA: users.map((u) => {
					return { id: u.id, lastName: u.keyC };
				}),
			});

			const entityA = new EntityA({ keyA: nameA, keyArray: users, keyEmbedded: user, additionalRequiredKey: 5 });
			entityA.id = id;

			return { mapper, doA, entityA };
		};

		it('should create a new entity from Do if nothing exists', () => {
			const { mapper, doA, entityA } = setup();

			const result = mapper.createEntity(doA);

			expect(result).toStrictEqual(entityA);
		});
	});
	describe('when one entity resolve in multiple domain objects', () => {});
	describe.skip('when multiple entities resolve in one domain object', () => {});
	describe('when one generic object resolve in one domain object', () => {}); // todo allow as type
	describe.skip('when one generic object and entity resolve in one domain object', () => {});
	//---
	describe('when keys from domainObject are different to entity', () => {});
	describe.skip('when keys from domainObject are missed by mapping', () => {});
	describe('when embedded objects with id must be merged', () => {}); // todo check how complicated it is
	describe('when arrays must be merged into entites', () => {}); // todo add helper
	describe('when arrays that include embedded objects with id must be merged', () => {}); // todo add helper
});
