import { Injectable } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons';

@Injectable()
export class UserConfig {
	availableLanguages: string;

	constructor() {
		this.availableLanguages = Configuration.get('I18N__AVAILABLE_LANGUAGES') as string;
	}

	getAvailableLanguages(): string[] {
		const languages = this.availableLanguages.split(',');

		return languages;
	}
}
