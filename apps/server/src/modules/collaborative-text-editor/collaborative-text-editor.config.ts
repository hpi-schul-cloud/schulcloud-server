import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsNumber, IsString } from 'class-validator';

export const COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN = 'COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN';

@Configuration()
export class CollaborativeTextEditorConfig {
	@ConfigProperty('ETHERPAD__COOKIE_RELEASE_THRESHOLD')
	@IsNumber()
	public cookieReleaseThreshold = 7200;

	@ConfigProperty('ETHERPAD__COOKIE_EXPIRES_SECONDS')
	@IsNumber()
	public cookieExpiresInSeconds = 7200;

	@ConfigProperty('ETHERPAD__PAD_URI')
	@IsString()
	public padUri!: string;
}
