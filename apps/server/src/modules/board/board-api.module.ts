import { AuthorizationModule } from '@modules/authorization';
import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course';
import { LoggerModule } from '@src/core/logger';
import { RoomMemberModule } from '@modules/room-member';
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
import { RoomModule } from '../room';

@Module({
	imports: [BoardModule, LoggerModule, RoomMemberModule, RoomModule, forwardRef(() => AuthorizationModule)],
	controllers: [BoardController, ColumnController, CardController, ElementController, BoardSubmissionController],
	providers: [BoardUc, BoardNodePermissionService, ColumnUc, CardUc, ElementUc, SubmissionItemUc, CourseRepo],
})
export class BoardApiModule {}
