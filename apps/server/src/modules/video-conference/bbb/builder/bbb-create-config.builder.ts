import { TypeGuard } from '@shared/common/guards';
import { BBBCreateConfig, BBBRole, GuestPolicy } from '../request';
import { Builder } from './builder';

export class BBBCreateConfigBuilder extends Builder<BBBCreateConfig> {
	public withLogoutUrl(logoutUrl: string): BBBCreateConfigBuilder {
		this.product.logoutURL = logoutUrl;
		return this;
	}

	public withWelcome(welcome: string): BBBCreateConfigBuilder {
		this.product.welcome = welcome;
		return this;
	}

	public withGuestPolicy(guestPolicy: GuestPolicy): BBBCreateConfigBuilder {
		this.product.guestPolicy = guestPolicy;
		return this;
	}

	public withMuteOnStart(value: boolean): BBBCreateConfigBuilder {
		this.product.muteOnStart = value;
		return this;
	}

	public withScDomain(scDomain: string): BBBCreateConfigBuilder {
		this.product['meta_bbb-origin-server-name'] = scDomain;

		return this;
	}

	public override build(): BBBCreateConfig {
		TypeGuard.checkNotNullOrUndefined(
			this.product['meta_bbb-origin-server-name'],
			new Error('meta_bbb-origin-server-name is required')
		);
		// Deprecated fields from BBB that have to be set to a consistent value, in order to call the create endpoint multiple times without error
		this.product.moderatorPW = BBBRole.MODERATOR;
		this.product.attendeePW = BBBRole.VIEWER;

		this.product.allowModsToUnmuteUsers = true;

		return super.build();
	}
}
