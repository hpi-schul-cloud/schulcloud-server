import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { CourseModule } from '@modules/course';
import { RoomModule } from '@modules/room';
import { RoomMembershipModule } from '@modules/room-membership';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { BoardModule } from './board.module';
import { BoardCollaborationGateway } from './gateway/board-collaboration.gateway';
import { MetricsService } from './metrics/metrics.service';
import { BoardUc, CardUc, ColumnUc, ElementUc } from './uc';

@Module({
	imports: [
		BoardModule,
		CourseModule,
		forwardRef(() => AuthorizationModule),
		LoggerModule,
		UserModule,
		RoomMembershipModule,
		RoomModule,
		BoardContextApiHelperModule,
	],
	providers: [BoardCollaborationGateway, CardUc, ColumnUc, ElementUc, BoardUc, MetricsService],
	exports: [],
})
export class BoardWsApiModule {}
