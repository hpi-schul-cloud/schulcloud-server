import { BBBCreateConfig } from '@src/modules/video-conference/config/bbb-create.config';

export class BBBCreateBreakoutConfig extends BBBCreateConfig {
	constructor(config: BBBCreateBreakoutConfig) {
		super(config);
		this.parentMeetingID = config.parentMeetingID;
		this.sequence = config.sequence;
		this.freeJoin = config.freeJoin;
		this.breakoutRoomsPrivateChatEnabled = config.breakoutRoomsPrivateChatEnabled;
		this.breakoutRoomsRecord = config.breakoutRoomsRecord;
	}

	readonly isBreakout: boolean = true;

	parentMeetingID: string;

	sequence: number;

	freeJoin?: boolean;

	breakoutRoomsPrivateChatEnabled?: boolean;

	breakoutRoomsRecord?: boolean;
}
