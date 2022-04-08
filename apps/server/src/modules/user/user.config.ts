import { Injectable } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons';

@Injectable()
export class UserConfig {
	avaibleLanguage: string;

	constructor() {
		this.avaibleLanguage = Configuration.get('I18N__AVAILABLE_LANGUAGES') as string;
	}

	getAvailableLanguages(): string[] {
		const languages = this.avaibleLanguage.split(',');

		return languages;
	}
}
