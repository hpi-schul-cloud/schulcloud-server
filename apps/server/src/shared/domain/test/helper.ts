import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '../types/entity-id';
import { BaseEntity } from '../entity/base.entity';

export abstract class TestHelper<SchoolType> {
	users: BaseEntity[] = [];

	otherUser: BaseEntity;

	school: SchoolType;

	/**
	 * Create two user one that are used for create operations.
	 * The other is created for all is not part of created element operations.
	 * It also create a school that is used for this two user and all new added users.
	 *
	 * You get the the user over helper.getFirstUser(), or helper.getUsers(); and helper.getOtherUser();
	 * By executing helper.createAndAddUser() the getUsers() list is increased and all create operations will use it.
	 */
	constructor() {
		this.init();
	}

	// That any helper must implement this is a temporary solution until
	// user and school entity is avaible in global or shared scope.
	abstract createUser(): BaseEntity;

	abstract createSchool(): SchoolType;

	createId(entityId?: EntityId): ObjectId {
		const id = new ObjectId(entityId);
		return id;
	}

	createEntityId(): EntityId {
		const entityId = this.createId().toHexString();
		return entityId;
	}

	// If else mapping can removed after the abstract createUser() is replaced by createUser from global user entity.
	createAndAddUser(user?: BaseEntity | EntityId): void {
		const newUser = this.createUser();
		if (user instanceof BaseEntity) {
			newUser._id = user._id;
			newUser.id = user.id;
		} else if (typeof user === 'string') {
			newUser.id = user;
		}

		// TODO try to understand why we need that (uidp)
		// if (newUser instanceof BaseEntity && user instanceof BaseEntity && user.id) {
		// 	newUser.id = user.id;
		// } else if (newUser instanceof BaseEntity && typeof user === 'string') {
		// 	newUser.id = user;
		// } else if (typeof newUser === 'string' && user instanceof BaseEntity && user.id) {
		// 	newUser = user.id;
		// } else if (typeof newUser === 'string' && typeof user === 'string') {
		// 	newUser = user;
		// }

		this.users.push(newUser);
	}

	getFirstUser(): BaseEntity {
		return this.users[0];
	}

	// TODO: find better name for existing user that is not part of the ressources
	getOtherUser(): BaseEntity {
		return this.otherUser;
	}

	getUsers(): BaseEntity[] {
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
