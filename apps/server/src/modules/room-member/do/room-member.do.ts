import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { Role } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface RoomMemberProps extends AuthorizableObject {
	id: EntityId;
	roomId: ObjectId;
	userGroupId: ObjectId;
	members: { userId: ObjectId; role: Role }[];
	createdAt: Date;
	updatedAt: Date;
}

export class RoomMember extends DomainObject<RoomMemberProps> {
	public constructor(props: RoomMemberProps) {
		super(props);
	}

	public getProps(): RoomMemberProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	public get roomId(): ObjectId {
		return this.props.roomId;
	}

	public get userGroupId(): ObjectId {
		return this.props.userGroupId;
	}

	public get members(): RoomMemberProps['members'] {
		return this.props.members;
	}

	public set members(members: RoomMemberProps['members']) {
		this.props.members = members;
	}

	public addMember(userId: ObjectId, role: Role): void {
		this.props.members.push({ userId, role });
	}

	public removeMember(userId: ObjectId): void {
		this.props.members = this.props.members.filter((member) => member.userId !== userId);
	}
}
