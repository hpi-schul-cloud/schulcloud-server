import { Configuration } from '@hpi-schul-cloud/commons';
import { BBBCreateConfig, BBBRole, GuestPolicy } from '../request';
import { Builder } from './builder';

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

	override build(): BBBCreateConfig {
		this.product['meta_bbb-origin-server-name'] = Configuration.get('SC_DOMAIN') as string;

		// Deprecated fields from BBB that have to be set to a consistent value, in order to call the create endpoint multiple times without error
		this.product.moderatorPW = BBBRole.MODERATOR;
		this.product.attendeePW = BBBRole.VIEWER;

		this.product.allowModsToUnmuteUsers = true;

		return super.build();
	}
}
