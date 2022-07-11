import { BBBJoinConfig, BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { Builder } from '@src/modules/video-conference/builder/builder';

export class BBBJoinConfigBuilder extends Builder<BBBJoinConfig> {
	asGuest(value: boolean): BBBJoinConfigBuilder {
		this.product.guest = value;
		return this;
	}

	withRole(value: BBBRole): BBBJoinConfigBuilder {
		this.product.role = value;
		return this;
	}
}
