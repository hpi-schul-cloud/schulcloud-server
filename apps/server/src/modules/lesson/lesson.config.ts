import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsUrl } from 'class-validator';

export const LESSON_CONFIG_TOKEN = 'LESSON_CONFIG_TOKEN';

@Configuration()
export class LessonConfig {
	@ConfigProperty('ETHERPAD__PAD_URI')
	@IsUrl({ require_tld: false })
	public padUri!: string;

	@ConfigProperty('FEATURE_ETHERPAD_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureEtherpadEnabled = true;
}
