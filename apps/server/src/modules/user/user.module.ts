import { Injectable, Module } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons';

import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';

import { UserController } from './controller';
import { UserUC } from './uc';
import { IUserConfig } from './interfaces';

@Injectable()
export class UserConfig implements IUserConfig {
	avaibleLanguage: string;

	constructor() {
		this.avaibleLanguage = Configuration.get('I18N__AVAILABLE_LANGUAGES') as string;
	}

	getAviableLanguages(): string[] {
		const languages = this.avaibleLanguage.split(',');

		return languages;
	}
}

@Module({
	controllers: [UserController],
	providers: [
		UserRepo,
		PermissionService,
		UserUC,
		{
			provide: 'User_Config',
			useClass: UserConfig,
		},
	],
})
export class UserModule {}
