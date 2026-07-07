import { type AlertPublicApiConfig } from '@modules/alert';
import { type BoardPublicApiConfig } from '@modules/board';
import { type BoardContextPublicApiConfig } from '@modules/board-context';
import { type CommonCartridgePublicApiConfig } from '@modules/common-cartridge';
import { type FwuPublicApiConfig } from '@modules/fwu-learning-contents';
import { type LearnroomPublicApiConfig } from '@modules/learnroom';
import { type OauthPublicApiConfig } from '@modules/oauth';
import { type ProvisioningPublicApiConfig } from '@modules/provisioning';
import { type RegistrationPublicApiConfig } from '@modules/registration';
import { type RoomPublicApiConfig } from '@modules/room';
import { type RosterPublicApiConfig } from '@modules/roster';
import { type SharingPublicApiConfig } from '@modules/sharing';
import { type TaskPublicApiConfig } from '@modules/task';
import { type ToolPublicApiConfig } from '@modules/tool';
import { type UserPublicApiConfig } from '@modules/user';
import { type UserImportPublicApiConfig } from '@modules/user-import';
import { type UserLoginMigrationPublicApiConfig } from '@modules/user-login-migration';
import { type VideoConferencePublicApiConfig } from '@modules/video-conference';
import { type ServerPublicApiConfig } from '../../server.config';
import { ConfigResponse } from '../dto';
import { type TeamPublicApiConfig } from '@modules/team';

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
		teamConfig: TeamPublicApiConfig
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
			...teamConfig,
		});

		return configResponse;
	}
}
