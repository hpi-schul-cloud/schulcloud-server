import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { GroupEntity } from '@src/modules/group/entity/group.entity';

export interface RoomMemberProps extends AuthorizableObject {
	id: EntityId;
	roomId: ObjectId;
	userGroup: GroupEntity;
	createdAt: Date;
	updatedAt: Date;
}

export type RoomMemberCreateProps = Pick<RoomMemberProps, 'roomId'>;
export type RoomMemberUpdateProps = RoomMemberCreateProps;

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

	public get userGroup(): GroupEntity {
		return this.props.userGroup;
	}
}
