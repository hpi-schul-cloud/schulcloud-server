import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from './board.module';
import { MediaBoardController, MediaElementController, MediaLineController } from './controller';
import { MediaBoardUc, MediaElementUc, MediaLineUc } from './uc';

@Module({
	imports: [BoardModule, LoggerModule, AuthorizationModule],
	controllers: [MediaBoardController, MediaLineController, MediaElementController],
	providers: [MediaBoardUc, MediaLineUc, MediaElementUc],
})
export class MediaBoardApiModule {}
