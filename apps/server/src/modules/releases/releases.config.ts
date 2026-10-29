import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';

export const RELEASES_CONFIG_TOKEN = 'RELEASES_CONFIG_TOKEN';

@Configuration()
export class ReleasesConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('RELEASE_NOTES_REPO_URL')
	public releaseNotesRepoUrl = 'https://api.github.com/repos/hpi-schul-cloud/RELEASE-NOTES/releases';
}
