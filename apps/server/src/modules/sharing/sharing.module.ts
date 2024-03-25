import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { LessonModule } from '@modules/lesson';
import { LearnroomModule } from '@modules/learnroom';
import { TaskModule } from '@modules/task';
import { BoardModule } from '@modules/board/board.module';
import { ShareTokenController } from './controller/share-token.controller';
import { ShareTokenUC } from './uc';
import { ShareTokenService, TokenGenerator } from './service';
import { ShareTokenRepo } from './repo/share-token.repo';

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
	],
	controllers: [ShareTokenController],
	providers: [ShareTokenUC],
})
export class SharingApiModule {}
