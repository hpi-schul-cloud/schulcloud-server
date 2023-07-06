import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { BoardModule } from './board.module';
import {
	BoardController,
	CardController,
	ColumnController,
	ElementController,
	SubElementController,
	SubmissionBoardController,
} from './controller';
import { BoardUc, CardUc, ElementUc, SubElementUc } from './uc';

@Module({
	imports: [BoardModule, LoggerModule, forwardRef(() => AuthorizationModule)],
	controllers: [
		BoardController,
		ColumnController,
		CardController,
		ElementController,
		SubElementController,
		SubmissionBoardController,
	],
	providers: [BoardUc, CardUc, ElementUc, SubElementUc],
})
export class BoardApiModule {}
