import { type BBBJoinConfig, type BBBRole } from '../request/bbb-join.config';
import { Builder } from './builder';

export class BBBJoinConfigBuilder extends Builder<BBBJoinConfig> {
	public asGuest(value: boolean): BBBJoinConfigBuilder {
		this.product.guest = value;
		return this;
	}

	public withRole(value: BBBRole): BBBJoinConfigBuilder {
		this.product.role = value;
		return this;
	}

	public withUserId(value: string): BBBJoinConfigBuilder {
		this.product.userID = value;
		return this;
	}
}
