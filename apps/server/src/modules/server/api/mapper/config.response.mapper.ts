import { AlertPublicApiConfig } from '@modules/alert';
import { BoardPublicApiConfig } from '@modules/board';
import { BoardContextPublicApiConfig } from '@modules/board-context';
import { CommonCartridgePublicApiConfig } from '@modules/common-cartridge';
import { FwuPublicApiConfig } from '@modules/fwu-learning-contents';
import { LearnroomPublicApiConfig } from '@modules/learnroom';
import { OauthPublicApiConfig } from '@modules/oauth';
import { ProvisioningPublicApiConfig } from '@modules/provisioning';
import { RegistrationPublicApiConfig } from '@modules/registration';
import { RocketChatPublicApiConfig } from '@modules/rocketchat';
import { RoomPublicApiConfig } from '@modules/room';
import { RosterPublicApiConfig } from '@modules/roster';
import { SharingPublicApiConfig } from '@modules/sharing';
import { TaskPublicApiConfig } from '@modules/task';
import { ToolPublicApiConfig } from '@modules/tool';
import { UserPublicApiConfig } from '@modules/user';
import { UserImportPublicApiConfig } from '@modules/user-import';
import { UserLoginMigrationPublicApiConfig } from '@modules/user-login-migration';
import { VideoConferencePublicApiConfig } from '@modules/video-conference';
import { ServerPublicApiConfig } from '../../server.config';
import { ConfigResponse } from '../dto';

export class ConfigResponseMapper {
	public static mapToResponse(
		serverConfig: ServerPublicApiConfig,
		videoConferenceConfig: VideoConferencePublicApiConfig,
		boardContextConfig: BoardContextPublicApiConfig,
		alertConfig: AlertPublicApiConfig,
		oauthConfig: OauthPublicApiConfig,
		boardConfig: BoardPublicApiConfig,
		provisioningConfig: ProvisioningPublicApiConfig,
		registrationConfig: RegistrationPublicApiConfig,
		rosterConfig: RosterPublicApiConfig,
		roomConfig: RoomPublicApiConfig,
		sharingConfig: SharingPublicApiConfig,
		commonCartridgeConfig: CommonCartridgePublicApiConfig,
		toolConfig: ToolPublicApiConfig,
		taskConfig: TaskPublicApiConfig,
		learnroomConfig: LearnroomPublicApiConfig,
		userConfig: UserPublicApiConfig,
		userImportConfig: UserImportPublicApiConfig,
		userLoginMigrationConfig: UserLoginMigrationPublicApiConfig,
		fwuConfig: FwuPublicApiConfig,
		rocketChatConfig: RocketChatPublicApiConfig
	): ConfigResponse {
		const configResponse = new ConfigResponse({
			...serverConfig,
			...videoConferenceConfig,
			...boardContextConfig,
			...alertConfig,
			...oauthConfig,
			...boardConfig,
			...provisioningConfig,
			...registrationConfig,
			...rosterConfig,
			...roomConfig,
			...sharingConfig,
			...commonCartridgeConfig,
			...toolConfig,
			...taskConfig,
			...learnroomConfig,
			...userConfig,
			...userImportConfig,
			...userLoginMigrationConfig,
			...fwuConfig,
			...rocketChatConfig,
		});

		return configResponse;
	}
}
