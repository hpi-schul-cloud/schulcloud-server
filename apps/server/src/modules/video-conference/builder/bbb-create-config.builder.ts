import { Builder } from '@src/modules/video-conference/builder/builder';
import { BBBCreateConfig, GuestPolicy } from '../config/bbb-create.config';

export class BBBCreateConfigBuilder extends Builder<BBBCreateConfig> {
	withLogoutUrl(logoutUrl: string): BBBCreateConfigBuilder {
		this.product.logoutURL = logoutUrl;
		return this;
	}

	withWelcome(welcome: string): BBBCreateConfigBuilder {
		this.product.welcome = welcome;
		return this;
	}

	withGuestPolicy(guestPolicy: GuestPolicy): BBBCreateConfigBuilder {
		this.product.guestPolicy = guestPolicy;
		return this;
	}

	withMuteOnStart(value: boolean): BBBCreateConfigBuilder {
		this.product.muteOnStart = value;
		return this;
	}
}
