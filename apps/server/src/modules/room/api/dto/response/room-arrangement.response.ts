import { ApiProperty } from '@nestjs/swagger';

export class RoomGroupResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	collapsed: boolean;

	@ApiProperty({ type: [String], description: 'Visible room ids of the group in their saved order.' })
	roomIds: string[];

	constructor(props: RoomGroupResponse) {
		this.id = props.id;
		this.name = props.name;
		this.collapsed = props.collapsed;
		this.roomIds = props.roomIds;
	}
}

export class RoomArrangementResponse {
	@ApiProperty({ description: 'Revision to send as expectedRevision with the next change.', minimum: 0 })
	revision: number;

	@ApiProperty({ type: [String], description: 'Visible ungrouped room ids in their saved order.' })
	ungroupedRoomIds: string[];

	@ApiProperty({ type: [RoomGroupResponse] })
	groups: RoomGroupResponse[];

	@ApiProperty()
	confirmGroupDeletion: boolean;

	@ApiProperty({ description: 'Whether the user dismissed the first-run hint about room groups.' })
	groupingHintDismissed: boolean;

	constructor(props: RoomArrangementResponse) {
		this.revision = props.revision;
		this.ungroupedRoomIds = props.ungroupedRoomIds;
		this.groups = props.groups;
		this.confirmGroupDeletion = props.confirmGroupDeletion;
		this.groupingHintDismissed = props.groupingHintDismissed;
	}
}

export class RoomGroupCreatedResponse extends RoomArrangementResponse {
	@ApiProperty()
	createdGroupId: string;

	constructor(props: RoomGroupCreatedResponse) {
		super(props);
		this.createdGroupId = props.createdGroupId;
	}
}
