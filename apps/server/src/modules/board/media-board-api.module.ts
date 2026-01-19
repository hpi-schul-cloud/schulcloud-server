import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { SagaModule } from '@modules/saga';
import { SchoolLicenseModule } from '@modules/school-license';
import { UserModule } from '@modules/user';
import { UserLicenseModule } from '@modules/user-license';
import { forwardRef, Module } from '@nestjs/common';
import { ToolModule } from '../tool';
import { BoardModule } from './board.module';
import { MediaBoardController, MediaElementController, MediaLineController } from './controller';
import { MediaBoardModule } from './media-board.module';
import { DeleteUserBoardDataStep } from './saga';
import { BoardNodePermissionService } from './service';
import { MediaAvailableLineUc, MediaBoardUc, MediaElementUc, MediaLineUc } from './uc';
import { BOARD_CONFIG_TOKEN, BoardConfig } from './board.config';

@Module({
	imports: [
		ConfigurationModule.register(BOARD_CONFIG_TOKEN, BoardConfig),
		BoardModule,
		LoggerModule,
		UserModule,
		forwardRef(() => AuthorizationModule),
		MediaBoardModule,
		ToolModule,
		UserLicenseModule,
		SchoolLicenseModule,
		SagaModule,
	],
	controllers: [MediaBoardController, MediaLineController, MediaElementController],
	providers: [
		BoardNodePermissionService,
		MediaBoardUc,
		MediaLineUc,
		MediaElementUc,
		MediaAvailableLineUc,
		DeleteUserBoardDataStep,
	],
})
export class MediaBoardApiModule {}
