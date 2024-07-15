import { AuthenticationModule } from '@modules/authentication';
import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { EduSharingController } from './controller';
import { config } from './edu-sharing.config';
import { EduSharingModule } from './edu-sharing.module';
import { EduSharingUC } from './uc';

@Module({
	imports: [
		AuthorizationModule,
		AuthorizationReferenceModule,
		EduSharingModule,
		AuthenticationModule,
		CoreModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	controllers: [EduSharingController],
	providers: [EduSharingUC],
})
export class EduSharingApiModule {}
