import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthorizationReferenceModule } from '@src/modules/authorization/authorization-reference.module';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenUC } from './uc';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenRepo } from './repo/share-token.repo';
import { LessonModule } from '../lesson';
import { LearnroomModule } from '../learnroom';
import { TaskModule } from '../task';

@Module({
	imports: [AuthorizationModule, AuthorizationReferenceModule, LoggerModule, LearnroomModule, LessonModule, TaskModule],
	controllers: [],
	providers: [ShareTokenService, TokenGenerator, ShareTokenRepo],
	exports: [ShareTokenService],
})
export class SharingModule {}

@Module({
	imports: [
		SharingModule,
		AuthorizationModule,
		AuthorizationReferenceModule,
		LearnroomModule,
		LessonModule,
		TaskModule,
		LoggerModule,
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
