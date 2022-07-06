import { BBBJoinConfig, BBBRole } from '@src/modules/video-conference/config/bbb-join.config';
import { Builder } from '@src/modules/video-conference/builder/builder';

export class BBBJoinConfigBuilder extends Builder<BBBJoinConfig> {
	asGuest(): BBBJoinConfigBuilder {
		this.product.guest = true;
		return this;
	}
}
