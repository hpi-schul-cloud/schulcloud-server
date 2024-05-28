import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { BoardModule } from '@modules/board';
import { LearnroomModule } from '@modules/learnroom';
import { LessonModule } from '@modules/lesson';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenRepo } from './repo/share-token.repo';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenUC } from './uc';

@Module({
	imports: [
		AuthorizationModule,
		AuthorizationReferenceModule,
		LoggerModule,
		LearnroomModule,
		LessonModule,
		TaskModule,
		BoardModule,
	],
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
		BoardModule,
		SchoolModule,
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
