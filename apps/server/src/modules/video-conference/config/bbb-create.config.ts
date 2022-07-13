export enum GuestPolicy {
	ALWAYS_ACCEPT = 'ALWAYS_ACCEPT',
	ALWAYS_DENY = 'ALWAYS_DENY',
	ASK_MODERATOR = 'ASK_MODERATOR',
}

export class BBBCreateConfig {
	constructor(config: BBBCreateConfig) {
		this.name = config.name;
		this.meetingID = config.meetingID;
		this.logoutURL = config.logoutURL;
		this.welcome = config.welcome;
		this.guestPolicy = config.guestPolicy;
		this.moderatorPW = config.moderatorPW;
		this.attendeePW = config.attendeePW;
		this.allowModsToUnmuteUsers = config.allowModsToUnmuteUsers;
	}

	name: string;

	meetingID: string;

	attendeePW?: string;

	moderatorPW?: string;

	logoutURL?: string;

	welcome?: string;

	guestPolicy?: GuestPolicy;

	muteOnStart?: boolean;

	allowModsToUnmuteUsers?: boolean;
}
