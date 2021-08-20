import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '../types/entity-id';
import { BaseEntity } from '../entity/base.entity';

// TODO: write tests..
export abstract class TestHelper<SchoolType> {
	private users: (EntityId | BaseEntity)[] = [];

	private otherUser: EntityId | BaseEntity;

	private school: SchoolType;

	constructor() {
		this.init();
	}

	// That any helper must implement this is a temporary solution until
	// user and school entity is avaible in global or shared scope.
	abstract createUser(): EntityId | BaseEntity;

	abstract createSchool(): SchoolType;

	createId(): ObjectId {
		const id = new ObjectId();
		return id;
	}

	createEntityId(): EntityId {
		const entityId = this.createId().toHexString();
		return entityId;
	}

	createAndAddUser(user?: EntityId | BaseEntity): void {
		let newUser = this.createUser();

		if (newUser instanceof BaseEntity && user instanceof BaseEntity && user.id) {
			newUser.id = user.id;
		} else if (newUser instanceof BaseEntity && typeof user === 'string') {
			newUser.id = user;
		} else if (typeof newUser === 'string' && user instanceof BaseEntity && user.id) {
			newUser = user.id;
		} else if (typeof newUser === 'string' && typeof user === 'string') {
			newUser = user;
		}

		this.users.push(newUser);
	}

	getFirstUser(): EntityId | BaseEntity {
		return this.users[0];
	}

	// TODO: find better name for existing user that is not part of the ressources
	getOtherUser(): EntityId | BaseEntity {
		return this.otherUser;
	}

	getUsers(): (EntityId | BaseEntity)[] {
		return this.users;
	}

	getSchool(): SchoolType {
		return this.school;
	}

	protected addId(entity: BaseEntity): void {
		const id = this.createId();
		entity.id = id.toHexString();
		entity._id = id;
	}

	// Temp solution until abstract createUser and createSchool is solved.
	// It can move to constructor
	private init(): void {
		this.school = this.createSchool();
		this.createAndAddUser();
		this.otherUser = this.createUser();
	}
}
