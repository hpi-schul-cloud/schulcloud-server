import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { CourseModule } from '@modules/course';
import { RoomMembershipModule } from '@modules/room-membership';
import { forwardRef, Module } from '@nestjs/common';
import { BoardContextApiHelperModule } from '../board-context';
import { RoomModule } from '../room';
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
import { SagaModule } from '@modules/saga';
import { CopyRoomBoardsStep } from './saga';
import { CopyHelperModule } from '@modules/copy-helper';

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
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, BoardNodePermissionService, ColumnUc, CardUc, ElementUc, SubmissionItemUc, CopyRoomBoardsStep],
})
export class BoardApiModule {}
