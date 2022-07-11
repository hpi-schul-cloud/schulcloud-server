import { GuestPolicy } from '@src/modules/video-conference/config/bbb-create.config';

export class BBBCreateBody {
	constructor(body: BBBCreateBody) {
		this.welcome = body.welcome;
		this.guestPolicy = body.guestPolicy;
	}

	welcome?: string;

	guestPolicy?: GuestPolicy;

	muteOnStart?: boolean;
}
