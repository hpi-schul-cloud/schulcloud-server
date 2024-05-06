import { AuthorizationModule } from '@modules/authorization';
import { UserLicenseModule } from '@modules/user-license';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ToolModule } from '../tool';
import { BoardModule } from './board.module';
import { MediaBoardController, MediaElementController, MediaLineController } from './controller';
import { MediaBoardModule } from './media-board.module';
import { MediaAvailableLineUc, MediaBoardUc, MediaElementUc, MediaLineUc } from './uc';

@Module({
	imports: [BoardModule, LoggerModule, AuthorizationModule, MediaBoardModule, ToolModule, UserLicenseModule],
	controllers: [MediaBoardController, MediaLineController, MediaElementController],
	providers: [MediaBoardUc, MediaLineUc, MediaElementUc, MediaAvailableLineUc],
})
export class MediaBoardApiModule {}
