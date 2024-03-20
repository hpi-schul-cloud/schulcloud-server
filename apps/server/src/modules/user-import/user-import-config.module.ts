import { Module } from '@nestjs/common';
import { UserImportConfiguration, UserImportFeatures } from './config';

@Module({
	providers: [
		{
			provide: UserImportFeatures,
			useValue: UserImportConfiguration.userImportFeatures,
		},
	],
	exports: [UserImportFeatures],
})
export class UserImportConfigModule {}
