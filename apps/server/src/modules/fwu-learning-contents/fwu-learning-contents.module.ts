import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { Logger } from '@src/core/logger';
import { FwuController } from './controller/fwu-learning-contents.controller';
import { FwuUc } from './uc/fwu-learning-contents.uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [FwuLearningContentsController],
	providers: [FwuLearningContentsUc, Logger],
})
export class FwuLearningContentsModule {}
