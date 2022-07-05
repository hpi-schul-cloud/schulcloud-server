enum GuestPolicy {
	ALWAYS_ACCEPT = 'ALWAYS_ACCEPT',
	ALWAYS_DENY = 'ALWAYS_DENY',
	ASK_MODERATOR = 'ASK_MODERATOR',
}

export class BBBCreateConfig {
	constructor(config: BBBCreateConfig) {
		this.name = config.name;
		this.meetingID = config.meetingID;
		this.welcome = config.welcome;
		this.guestPolicy = config.guestPolicy;
	}

	name: string;

	meetingID: string;

	welcome?: string;

	guestPolicy?: GuestPolicy;
}
