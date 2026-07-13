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

	public name: string;

	public attendeePW?: string;

	public moderatorPW?: string;

	public logoutURL?: string;

	public welcome?: string;

	public guestPolicy?: GuestPolicy;

	public muteOnStart?: boolean;

	public allowModsToUnmuteUsers?: boolean;

	public 'meta_bbb-origin-server-name'?: string;
}
