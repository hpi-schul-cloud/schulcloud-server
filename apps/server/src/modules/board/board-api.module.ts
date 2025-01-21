import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { RoomMembershipModule } from '@modules/room-membership';
import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course';
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

@Module({
	imports: [
		BoardModule,
		LoggerModule,
		RoomMembershipModule,
		RoomModule,
		forwardRef(() => AuthorizationModule),
		BoardContextApiHelperModule,
	],
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, BoardNodePermissionService, ColumnUc, CardUc, ElementUc, SubmissionItemUc, CourseRepo],
})
export class BoardApiModule {}
