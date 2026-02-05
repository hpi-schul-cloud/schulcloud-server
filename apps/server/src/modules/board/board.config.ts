import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString, IsUrl } from 'class-validator';

export const BOARD_CONFIG_TOKEN = 'BOARD_CONFIG_TOKEN';
export const BOARD_PUBLIC_API_CONFIG_TOKEN = 'BOARD_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class BoardPublicApiConfig {
	@ConfigProperty('FEATURE_MEDIA_SHELF_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureMediaShelfEnabled = false;

	@ConfigProperty('FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE')
	@StringToBoolean()
	@IsBoolean()
	public featureBoardReadersCanEditToggle = true;

	@ConfigProperty('FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardSubmissionsEnabled = false;

	@ConfigProperty('FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardLinkElementEnabled = true;

	@ConfigProperty('FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardCollaborativeTextEditorEnabled = true;

	@ConfigProperty('FEATURE_COLUMN_BOARD_SOCKET_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardSocketEnabled = false;

	@ConfigProperty('FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardFileFolderEnabled = true;

	@ConfigProperty('FEATURE_COLUMN_BOARD_H5P_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardH5pEnabled = true;

	@ConfigProperty('FEATURE_COLUMN_BOARD_COLLABORA_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureColumnBoardCollaboraEnabled = true;

	@ConfigProperty('FEATURE_TLDRAW_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureTldrawEnabled = true;

	@ConfigProperty('BOARD_COLLABORATION_URI')
	@IsUrl({ require_tld: false, require_valid_protocol: false })
	public boardCollaborationUri = 'ws://localhost:4450';
}

@Configuration()
export class BoardConfig extends BoardPublicApiConfig {
	@ConfigProperty('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexMediaLicenseEnabled = false;

	@ConfigProperty('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureVidisMediaActivationsEnabled = false;

	@ConfigProperty('FEATURE_CTL_TOOLS_COPY_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureCtlToolsCopyEnabled = false;

	@IsUrl({ require_tld: false })
	@ConfigProperty('HOST')
	public hostUrl!: string;

	@ConfigProperty('BOARD_WS_BASE_PATH')
	@IsString()
	public basePath = '/board-collaboration';
}
