import {
	RoomArrangementResponse,
	RoomGroupCreatedResponse,
	RoomGroupResponse,
} from '../dto/response/room-arrangement.response';
import {
	type VisibleRoomArrangement,
	type VisibleRoomArrangementWithCreatedGroup,
} from '../../domain/type/visible-room-arrangement';

export class RoomArrangementMapper {
	public static mapToRoomArrangementResponse(arrangement: VisibleRoomArrangement): RoomArrangementResponse {
		const response = new RoomArrangementResponse({
			revision: arrangement.revision,
			ungroupedRoomIds: [...arrangement.ungroupedRoomIds],
			groups: RoomArrangementMapper.mapToRoomGroupResponses(arrangement),
			confirmGroupDeletion: arrangement.confirmGroupDeletion,
			groupingHintDismissed: arrangement.groupingHintDismissed,
		});

		return response;
	}

	public static mapToRoomGroupCreatedResponse(
		arrangement: VisibleRoomArrangementWithCreatedGroup
	): RoomGroupCreatedResponse {
		const response = new RoomGroupCreatedResponse({
			revision: arrangement.revision,
			ungroupedRoomIds: [...arrangement.ungroupedRoomIds],
			groups: RoomArrangementMapper.mapToRoomGroupResponses(arrangement),
			confirmGroupDeletion: arrangement.confirmGroupDeletion,
			groupingHintDismissed: arrangement.groupingHintDismissed,
			createdGroupId: arrangement.createdGroupId,
		});

		return response;
	}

	private static mapToRoomGroupResponses(arrangement: VisibleRoomArrangement): RoomGroupResponse[] {
		const groups = arrangement.groups.map(
			(group) =>
				new RoomGroupResponse({
					id: group.id,
					name: group.name,
					collapsed: group.collapsed,
					roomIds: [...group.roomIds],
				})
		);

		return groups;
	}
}
