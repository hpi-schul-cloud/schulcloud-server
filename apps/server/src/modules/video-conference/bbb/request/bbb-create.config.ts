import { BBBBaseMeetingConfig } from './bbb-base-meeting.config';

export enum GuestPolicy {
	ALWAYS_ACCEPT = 'ALWAYS_ACCEPT',
	ALWAYS_DENY = 'ALWAYS_DENY',
	ASK_MODERATOR = 'ASK_MODERATOR',
}

export class BBBCreateConfig extends BBBBaseMeetingConfig {
	constructor(config: BBBCreateConfig) {
		super(config);
		this.name = config.name;
		this.meetingID = config.meetingID;
		this.logoutURL = config.logoutURL;
		this.welcome = config.welcome;
		this.guestPolicy = config.guestPolicy;
		this.moderatorPW = config.moderatorPW;
		this.attendeePW = config.attendeePW;
		this.allowModsToUnmuteUsers = config.allowModsToUnmuteUsers;
		this['meta_bbb-origin-server-name'] = config['meta_bbb-origin-server-name'];
	}

	name: string;

	attendeePW?: string;

	moderatorPW?: string;

	logoutURL?: string;

	welcome?: string;

	guestPolicy?: GuestPolicy;

	muteOnStart?: boolean;

	allowModsToUnmuteUsers?: boolean;

	'meta_bbb-origin-server-name'?: string;
}
