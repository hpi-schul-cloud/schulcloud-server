import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { RoomMembershipModule } from '@modules/room-membership';
import { SagaModule } from '@modules/saga';
import { forwardRef, Module } from '@nestjs/common';
import { BoardContextApiHelperModule } from '../board-context';
import { RoomModule } from '../room';
import { BOARD_CONFIG_TOKEN, BoardConfig } from './board.config';
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
import { BOARD_TIMEOUT_CONFIG_TOKEN, BoardTimeoutConfig } from './timeout.config';
import { BoardErrorReportUc, BoardUc, CardUc, ColumnUc, ElementUc, SubmissionItemUc } from './uc';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_CONFIG_TOKEN, BoardConfig),
		ConfigurationModule.register(BOARD_TIMEOUT_CONFIG_TOKEN, BoardTimeoutConfig),
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
@RegisterTimeoutConfig(BOARD_TIMEOUT_CONFIG_TOKEN)
export class BoardApiModule {}
