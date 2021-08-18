import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '../types/entity-id';
import { BaseEntity } from '../entity/base.entity';

// TODO: write tests..
export abstract class TestHelper<UserType, SchoolType> {
	private users: UserType[] = [];

	private otherUser: UserType;

	private school: SchoolType;

	constructor() {
		this.init();
	}

	// That any helper must implement this is a temporary solution until
	// user and school entity is avaible in global or shared scope.
	abstract createUser(): UserType;

	abstract createSchool(): SchoolType;

	createId(): ObjectId {
		const id = new ObjectId();
		return id;
	}

	createEntityId(): EntityId {
		const entityId = this.createId().toHexString();
		return entityId;
	}

	createAndAddUser(): void {
		const newUser = this.createUser();
		this.users.push(newUser);
	}

	getFirstUser(): UserType {
		return this.users[0];
	}

	// TODO: find better name for existing user that is not part of the ressources
	getOtherUser(): UserType {
		return this.otherUser;
	}

	getUsers(): UserType[] {
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
