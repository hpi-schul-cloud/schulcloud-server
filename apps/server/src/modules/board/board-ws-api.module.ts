import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { UserModule } from '@modules/user';
import { BoardModule } from './board.module';
import { BoardCollaborationGateway } from './gateway/board-collaboration.gateway';
import { MetricsService } from './metrics/metrics.service';
import { BoardUc, CardUc, ColumnUc, ElementUc } from './uc';

@Module({
	imports: [BoardModule, forwardRef(() => AuthorizationModule), LoggerModule, UserModule],
	providers: [BoardCollaborationGateway, CardUc, ColumnUc, ElementUc, BoardUc, CourseRepo, MetricsService],
	exports: [],
})
export class BoardWsApiModule {}
