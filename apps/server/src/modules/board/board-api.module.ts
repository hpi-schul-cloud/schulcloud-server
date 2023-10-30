import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { BoardModule } from './board.module';
import { BoardSubmissionController } from './controller/board-submission.controller';
import { BoardController } from './controller/board.controller';
import { CardController } from './controller/card.controller';
import { ColumnController } from './controller/column.controller';
import { ElementController } from './controller/element.controller';
import { BoardUc } from './uc/board.uc';
import { CardUc } from './uc/card.uc';
import { ElementUc } from './uc/element.uc';
import { SubmissionItemUc } from './uc/submission-item.uc';

@Module({
	imports: [BoardModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, CardUc, ElementUc, SubmissionItemUc],
})
export class BoardApiModule {}
