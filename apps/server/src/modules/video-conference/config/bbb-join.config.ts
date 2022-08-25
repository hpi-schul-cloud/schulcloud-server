import { BBBBaseMeetingConfig } from '@src/modules/video-conference/config/bbb-base-meeting.config';

export enum BBBRole {
	MODERATOR = 'MODERATOR',
	VIEWER = 'VIEWER',
}

export class BBBJoinConfig extends BBBBaseMeetingConfig {
	/* istanbul ignore next */
	constructor(config: BBBJoinConfig) {
		super(config);
		this.fullName = config.fullName;
		this.role = config.role;
		this.userID = config.userID;
		this.guest = config.guest;
		this.redirect = config.redirect;
	}

	fullName: string;

	role: BBBRole;

	userID?: string;

	guest?: boolean;

	redirect?: string;
}
