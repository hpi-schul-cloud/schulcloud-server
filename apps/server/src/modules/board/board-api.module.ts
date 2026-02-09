import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { RoomMembershipModule } from '@modules/room-membership';
import { SagaModule } from '@modules/saga';
import { forwardRef, Module } from '@nestjs/common';
import { BoardContextApiHelperModule } from '../board-context';
import { RoomModule } from '../room';
import { BoardModule } from './board.module';
import {
	BoardController,
	BoardErrorReportController,
	BoardSubmissionController,
	CardController,
	ColumnController,
	ElementController,
} from './controller';
import { CopyRoomBoardsStep } from './saga';
import { BoardErrorReportUc, BoardUc, CardUc, ColumnUc, ElementUc, SubmissionItemUc } from './uc';

@Module({
	imports: [
		CopyHelperModule,
		CourseModule,
		BoardModule,
		LoggerModule,
		RoomMembershipModule,
		RoomModule,
		forwardRef(() => AuthorizationModule),
		BoardContextApiHelperModule,
		SagaModule,
	],
	controllers: [
		BoardController,
		ColumnController,
		CardController,
		ElementController,
		BoardSubmissionController,
		BoardErrorReportController,
	],
	providers: [BoardUc, BoardErrorReportUc, ColumnUc, CardUc, ElementUc, SubmissionItemUc, CopyRoomBoardsStep],
})
export class BoardApiModule {}
