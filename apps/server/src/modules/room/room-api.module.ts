import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { AccountModule } from '@modules/account/account.module';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { SagaModule } from '@modules/saga';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { BoardModule } from '../board';
import { RoomMembershipModule } from '../room-membership/room-membership.module';
import { UserModule } from '../user';
import { RoomController, RoomInvitationLinkController, RoomInvitationLinkUc, RoomUc } from './api';
import { RoomArrangementUc } from './api/room-arrangement.uc';
import { RoomContentUc } from './api/room-content.uc';
import { RoomCopyUc } from './api/room-copy.uc';
import { CopyRoomStep } from './api/saga';
import { CopyRoomContentStep } from './api/saga/copy-room-content.step';
import { DeleteUserRoomDataStep } from './api/saga/delete-user-room-data.step';
import {
	RoomBoardCreatedHandler,
	RoomBoardDeletedHandler,
	RoomBoardService,
	RoomPermissionService,
} from './api/service';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from './room.config';
import { RoomModule } from './room.module';
import { ROOM_TIMEOUT_CONFIG_TOKEN, RoomTimeoutConfig } from './timeout.config';

@Module({
	imports: [
		RoomModule,
		AccountModule,
		AuthorizationModule,
		LoggerModule,
		RoomMembershipModule,
		BoardModule,
		UserModule,
		SchoolModule,
		CopyHelperModule,
		SagaModule,
		ConfigurationModule.register(ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig),
		ConfigurationModule.register(ROOM_TIMEOUT_CONFIG_TOKEN, RoomTimeoutConfig),
	],
	controllers: [RoomController, RoomInvitationLinkController],
	providers: [
		RoomUc,
		RoomInvitationLinkUc,
		RoomCopyUc,
		RoomArrangementUc,
		RoomContentUc,
		CopyRoomStep,
		CopyRoomContentStep,
		DeleteUserRoomDataStep,
		RoomPermissionService,
		RoomBoardCreatedHandler,
		RoomBoardDeletedHandler,
		RoomBoardService,
	],
})
@RegisterTimeoutConfig(ROOM_TIMEOUT_CONFIG_TOKEN)
export class RoomApiModule {}
