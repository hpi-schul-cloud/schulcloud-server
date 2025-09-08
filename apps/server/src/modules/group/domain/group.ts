import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { ExternalSource } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { GroupPeriod } from './group-period';
import { GroupTypes } from './group-types';
import { GroupUser } from './group-user';

export interface GroupProps extends AuthorizableObject {
	id: EntityId;

	name: string;

	type: GroupTypes;

	validPeriod?: GroupPeriod;

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

	set users(value: GroupUser[]) {
		this.props.users = value;
	}

	get externalSource(): ExternalSource | undefined {
		return this.props.externalSource;
	}

	get organizationId(): string | undefined {
		return this.props.organizationId;
	}

	get type(): GroupTypes {
		return this.props.type;
	}

	get validPeriod(): GroupPeriod | undefined {
		return this.props.validPeriod;
	}

	public isCurrentlyInValidPeriod(): boolean {
		if (!this.validPeriod) {
			return true;
		}
		const now: Date = new Date();
		if (this.validPeriod.from && this.validPeriod.from > now) {
			return false;
		}
		if (this.validPeriod.until && this.validPeriod.until < now) {
			return false;
		}
		return true;
	}

	public removeUser(userId: EntityId): void {
		this.props.users = this.props.users.filter((groupUser: GroupUser): boolean => groupUser.userId !== userId);
	}

	public isEmpty(): boolean {
		return this.props.users.length === 0;
	}

	public addUser(user: GroupUser): void {
		if (!this.users.find((u: GroupUser): boolean => u.userId === user.userId)) {
			this.users.push(user);
		}
	}

	public isMember(userId: EntityId, roleId?: EntityId): boolean {
		const isMember: boolean = this.users.some(
			(groupUser: GroupUser) => groupUser.userId === userId && (roleId ? groupUser.roleId === roleId : true)
		);

		return isMember;
	}
}
