import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RoomMemberProps extends AuthorizableObject {
	roomId: EntityId;
	userGroupId: EntityId;
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

	public get roomId(): EntityId {
		return this.props.roomId;
	}

	public get userGroupId(): EntityId {
		return this.props.userGroupId;
	}
}
