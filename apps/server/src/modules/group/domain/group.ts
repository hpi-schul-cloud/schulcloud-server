import { EntityId, ExternalSource, type UserDO } from '@shared/domain';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { GroupTypes } from './group-types';
import { GroupUser } from './group-user';

export interface GroupProps extends AuthorizableObject {
	id: EntityId;

	name: string;

	type: GroupTypes;

	validFrom?: Date;

	validUntil?: Date;

	externalSource?: ExternalSource;

	users: GroupUser[];

	organizationId?: string;
}

export class Group extends DomainObject<GroupProps> {
	get name(): string {
		return this.props.name;
	}

	get users(): GroupUser[] {
		return this.props.users;
	}

	get externalSource(): ExternalSource | undefined {
		return this.props.externalSource;
	}

	get organizationId(): string | undefined {
		return this.props.organizationId;
	}

	removeUser(user: UserDO): void {
		this.props.users = this.props.users.filter((groupUser: GroupUser): boolean => groupUser.userId !== user.id);
	}

	isEmpty(): boolean {
		return this.props.users.length === 0;
	}

	addUser(user: GroupUser): void {
		if (!this.users.find((u) => u.userId === user.userId)) {
			this.users.push(user);
		}
	}
}
