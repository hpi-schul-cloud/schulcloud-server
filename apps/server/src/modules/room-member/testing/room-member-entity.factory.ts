import { ObjectId } from '@mikro-orm/mongodb';
import { EntityFactory } from '@shared/testing/factory/entity.factory';
import { groupEntityFactory } from '@shared/testing';
import { RoomMemberEntity } from '../repo/entity/room-member.entity';
import { RoomMemberProps } from '../do/room-member.do';

export const roomMemberEntityFactory = EntityFactory.define<RoomMemberEntity, RoomMemberProps>(
	RoomMemberEntity,
	({ params }) => {
		return {
			id: new ObjectId().toHexString(),
			roomId: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			userGroup: groupEntityFactory.buildWithId({ ...params.userGroup }),
		};
	}
);
