import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { BoardModule } from './board.module';
import { SocketGateway } from './gateway/socket.gateway';
import { BoardUc, ColumnUc } from './uc';

@Module({
	imports: [BoardModule, forwardRef(() => AuthorizationModule), LoggerModule],
	providers: [SocketGateway, ColumnUc, BoardUc, CourseRepo],
	exports: [],
})
export class BoardWsApiModule {}
