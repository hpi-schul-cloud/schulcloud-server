import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { HttpModule } from '@nestjs/axios';
import { BoardModule } from './board.module';
import {
	BoardController,
	BoardSubmissionController,
	CardController,
	ColumnController,
	ElementController,
} from './controller';
import { BoardUc, CardUc, ColumnUc } from './uc';
import { ElementUc } from './uc/element.uc';
import { SubmissionItemUc } from './uc/submission-item.uc';

@Module({
	imports: [BoardModule, LoggerModule, forwardRef(() => AuthorizationModule), HttpModule],
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, ColumnUc, CardUc, ElementUc, SubmissionItemUc],
})
export class BoardApiModule {}
