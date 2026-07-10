import { BBBBaseMeetingConfig } from './bbb-base-meeting.config';

export enum BBBRole {
	MODERATOR = 'MODERATOR',
	VIEWER = 'VIEWER',
}

export class BBBJoinConfig extends BBBBaseMeetingConfig {
	constructor(config: BBBJoinConfig) {
		super(config);
		this.fullName = config.fullName;
		this.role = config.role;
		this.userID = config.userID;
		this.guest = config.guest;
		this.redirect = config.redirect;
	}

	public fullName: string;

	public role: BBBRole;

	public userID?: string;

	public guest?: boolean;

	public redirect?: string;
}
