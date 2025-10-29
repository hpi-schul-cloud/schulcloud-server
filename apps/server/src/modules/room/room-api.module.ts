import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { SagaModule } from '@modules/saga';
import { SchoolModule } from '@modules/school';
import { Module } from '@nestjs/common';
import { BoardModule } from '../board';
import { RoomMembershipModule } from '../room-membership/room-membership.module';
import { UserModule } from '../user';
import { RoomController, RoomInvitationLinkController, RoomInvitationLinkUc, RoomUc } from './api';
import { RoomCopyUc } from './api/room-copy.uc';
import { RoomModule } from './room.module';
import { CopyRoomStep } from './api/saga';
import {
	RoomPermissionService,
	RoomBoardCreatedHandler,
	RoomBoardDeletedHandler,
	RoomBoardService,
} from './api/service';
import { CopyRoomContentStep } from './api/saga/copy-room-content.step';

@Module({
	imports: [
		RoomModule,
		AuthorizationModule,
		LoggerModule,
		RoomMembershipModule,
		BoardModule,
		UserModule,
		SchoolModule,
		CopyHelperModule,
		SagaModule,
	],
	controllers: [RoomController, RoomInvitationLinkController],
	providers: [
		RoomUc,
		RoomInvitationLinkUc,
		RoomCopyUc,
		CopyRoomStep,
		CopyRoomContentStep,
		RoomPermissionService,
		RoomBoardCreatedHandler,
		RoomBoardDeletedHandler,
		RoomBoardService,
	],
})
export class RoomApiModule {}
