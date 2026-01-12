import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

export const ETHERPAD_CLIENT_CONFIG_TOKEN = 'ETHERPAD_CLIENT_CONFIG_TOKEN';

@Configuration()
export class EtherpadClientConfig {
	@ConfigProperty('ETHERPAD__API_KEY')
	@IsString()
	public apiKey!: string;

	@ConfigProperty('ETHERPAD__URI')
	@IsUrl()
	public basePath!: string;
}
