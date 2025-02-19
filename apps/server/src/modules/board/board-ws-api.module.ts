import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course';
import { LoggerModule } from '@core/logger';
import { RoomMembershipModule } from '@modules/room-membership';
import { RoomModule } from '@modules/room';
import { BoardContextApiHelperModule } from '@modules/board-context';
import { BoardModule } from './board.module';
import { BoardCollaborationGateway } from './gateway/board-collaboration.gateway';
import { MetricsService } from './metrics/metrics.service';
import { BoardNodePermissionService } from './service';
import { BoardUc, CardUc, ColumnUc, ElementUc } from './uc';

@Module({
	imports: [
		BoardModule,
		forwardRef(() => AuthorizationModule),
		LoggerModule,
		UserModule,
		RoomMembershipModule,
		RoomModule,
		BoardContextApiHelperModule,
	],
	providers: [
		BoardCollaborationGateway,
		BoardNodePermissionService,
		CardUc,
		ColumnUc,
		ElementUc,
		BoardUc,
		CourseRepo,
		MetricsService,
	],
	exports: [],
})
export class BoardWsApiModule {}
