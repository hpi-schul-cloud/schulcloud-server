import { MetaTagExtractorAdapterModule } from '@src/infra/meta-tag-extractor-client';
import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from './board.module';
import {
	BoardController,
	BoardSubmissionController,
	CardController,
	ColumnController,
	ElementController,
} from './controller';
import { BoardNodePermissionService } from './service';
import { BoardUc, CardUc, ColumnUc, ElementUc, SubmissionItemUc } from './uc';

@Module({
	imports: [BoardModule, LoggerModule, MetaTagExtractorAdapterModule, forwardRef(() => AuthorizationModule)],
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, BoardNodePermissionService, ColumnUc, CardUc, ElementUc, SubmissionItemUc, CourseRepo],
})
export class BoardApiModule {}
