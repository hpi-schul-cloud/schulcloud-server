import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export const BBB_CONFIG = 'BBB_CONFIG';
@Configuration()
export class BbbConfig {
	@IsUrl()
	@ConfigProperty()
	public VIDEOCONFERENCE_HOST!: string;

	@IsString()
	@ConfigProperty()
	public VIDEOCONFERENCE_SALT = '';

	@IsString()
	@ConfigProperty()
	public VIDEOCONFERENCE_DEFAULT_PRESENTATION = '';
}
