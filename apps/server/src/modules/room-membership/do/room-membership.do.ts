import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomMembershipProps extends AuthorizableObject {
	id: EntityId;
	roomId: EntityId;
	userGroupId: EntityId;
	schoolId: EntityId;
	createdAt: Date;
	updatedAt: Date;
}

export class RoomMembership extends DomainObject<RoomMembershipProps> {
	public constructor(props: RoomMembershipProps) {
		super(props);
	}

	public getProps(): RoomMembershipProps {
		// We need to make sure that only properties of type T are returned
		// At runtime the props are a MikroORM entity that has additional non-persisted properties
		// see @Property({ persist: false })
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	public get roomId(): EntityId {
		return this.props.roomId;
	}

	public get userGroupId(): EntityId {
		return this.props.userGroupId;
	}

	public get schoolId(): EntityId {
		return this.props.schoolId;
	}
}
