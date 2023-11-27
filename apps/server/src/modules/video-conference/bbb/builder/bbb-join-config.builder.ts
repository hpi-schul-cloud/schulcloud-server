import { BBBJoinConfig, BBBRole } from '../request/bbb-join.config';
import { Builder } from './builder';

export class BBBJoinConfigBuilder extends Builder<BBBJoinConfig> {
	asGuest(value: boolean): BBBJoinConfigBuilder {
		this.product.guest = value;
		return this;
	}

	withRole(value: BBBRole): BBBJoinConfigBuilder {
		this.product.role = value;
		return this;
	}

	withUserId(value: string): BBBJoinConfigBuilder {
		this.product.userID = value;
		return this;
	}
}
