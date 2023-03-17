import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules/authorization';
import { FwuLearningContentsController } from './controller/fwu-learning-contents.controller';
import { FwuLearningContentsModule } from './fwu-learning-contents.module';
import { FwuLearningContentsUc } from './uc';

@Module({
	imports: [AuthorizationModule, FwuLearningContentsModule, AuthenticationModule, CoreModule, HttpModule],
	controllers: [FwuLearningContentsController],
	providers: [FwuLearningContentsUc],
})
export class FwuLearningContentsApiModule {}
