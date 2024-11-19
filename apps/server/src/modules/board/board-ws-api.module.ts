import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { RoomMemberModule } from '../room-member';
import { BoardModule } from './board.module';
import { BoardCollaborationGateway } from './gateway/board-collaboration.gateway';
import { MetricsService } from './metrics/metrics.service';
import { BoardNodePermissionService } from './service';
import { BoardUc, CardUc, ColumnUc, ElementUc } from './uc';
import { RoomModule } from '../room';

@Module({
	imports: [BoardModule, forwardRef(() => AuthorizationModule), LoggerModule, UserModule, RoomMemberModule, RoomModule],
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
