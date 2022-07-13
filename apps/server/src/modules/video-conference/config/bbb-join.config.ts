export enum BBBRole {
	MODERATOR = 'MODERATOR',
	VIEWER = 'VIEWER',
}

export class BBBJoinConfig {
	constructor(config: BBBJoinConfig) {
		this.fullName = config.fullName;
		this.meetingID = config.meetingID;
		this.role = config.role;
		this.userID = config.userID;
		this.guest = config.guest;
		this.redirect = config.redirect;
	}

	fullName: string;

	meetingID: string;

	role: BBBRole;

	userID?: string;

	guest?: boolean;

	redirect?: string;
}
