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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageType } from '@shared/domain/interface';
import { SchulcloudTheme } from '@shared/domain/types';
import type { ServerPublicApiConfig } from '../..';
import { Timezone } from '../../types/timezone.enum';

export class ConfigResponse {
	@ApiProperty()
	ACCESSIBILITY_REPORT_EMAIL: string;

	@ApiProperty()
	SC_CONTACT_EMAIL: string;

	@ApiProperty()
	SC_CONTACT_EMAIL_SUBJECT: string;

	@ApiProperty()
	MIGRATION_END_GRACE_PERIOD_MS: number;

	@ApiProperty()
	FEATURE_SHOW_OUTDATED_USERS: boolean;

	@ApiProperty()
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: boolean;

	@ApiProperty()
	CTL_TOOLS_RELOAD_TIME_MS: number;

	@ApiProperty()
	FEATURE_CTL_TOOLS_COPY_ENABLED: boolean;

	@ApiProperty()
	FEATURE_PREFERRED_CTL_TOOLS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_SHOW_MIGRATION_WIZARD: boolean;

	@ApiPropertyOptional()
	MIGRATION_WIZARD_DOCUMENTATION_LINK?: string;

	@ApiProperty()
	FEATURE_TLDRAW_ENABLED: boolean;

	@ApiProperty()
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: boolean;

	@ApiProperty({ type: String, nullable: true })
	ALERT_STATUS_URL: string | null;

	@ApiProperty()
	FEATURE_ES_COLLECTIONS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_TEAMS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_LERNSTORE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_FWU_CONTENT_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED: boolean;

	@ApiProperty()
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: boolean;

	@ApiProperty()
	TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT: boolean;

	@ApiProperty()
	TEACHER_STUDENT_VISIBILITY__IS_VISIBLE: boolean;

	@ApiProperty()
	FEATURE_SCHOOL_POLICY_ENABLED_NEW: boolean;

	@ApiProperty()
	FEATURE_SCHOOL_TERMS_OF_USE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_VIDEOCONFERENCE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_SHARE: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_SOCKET_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED: boolean;

	@ApiProperty()
	public FEATURE_COLUMN_BOARD_H5P_ENABLED: boolean;

	@ApiProperty()
	public FEATURE_COLUMN_BOARD_COLLABORA_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COURSE_SHARE: boolean;

	@ApiProperty()
	FEATURE_LOGIN_LINK_ENABLED: boolean;

	@ApiProperty()
	FEATURE_LESSON_SHARE: boolean;

	@ApiProperty()
	FEATURE_TASK_SHARE: boolean;

	@ApiProperty()
	FEATURE_BOARD_LAYOUT_ENABLED: boolean;

	@ApiProperty()
	FEATURE_USER_MIGRATION_ENABLED: boolean;

	@ApiProperty()
	CALENDAR_SERVICE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COPY_SERVICE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_CONSENT_NECESSARY: boolean;

	@ApiProperty()
	FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: boolean;

	@ApiProperty()
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: boolean;

	@ApiProperty()
	FEATURE_USER_LOGIN_MIGRATION_ENABLED: boolean;

	@ApiProperty()
	FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED: boolean;

	@ApiProperty()
	GHOST_BASE_URL: string;

	@ApiProperty()
	ROCKETCHAT_SERVICE_ENABLED: boolean;

	// LERNSTORE_MODE: boolean; looks like not in use anymore

	@ApiProperty({
		isArray: true,
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	I18N__AVAILABLE_LANGUAGES: LanguageType[];

	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	I18N__DEFAULT_LANGUAGE: LanguageType;

	@ApiProperty({
		enum: LanguageType,
		enumName: 'LanguageType',
	})
	I18N__FALLBACK_LANGUAGE: LanguageType;

	@ApiProperty({ enum: Timezone, enumName: 'Timezone' })
	I18N__DEFAULT_TIMEZONE: Timezone;

	@ApiProperty()
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: number;

	@ApiProperty()
	JWT_TIMEOUT_SECONDS: number;

	@ApiProperty()
	NOT_AUTHENTICATED_REDIRECT_URL: string;

	@ApiProperty()
	DOCUMENT_BASE_DIR: string;

	@ApiProperty({ enum: SchulcloudTheme, enumName: 'SchulcloudTheme' })
	SC_THEME: SchulcloudTheme;

	@ApiProperty()
	SC_TITLE: string;

	@ApiProperty()
	TRAINING_URL: string;

	@ApiProperty()
	FEATURE_MEDIA_SHELF_ENABLED: boolean;

	@ApiProperty()
	BOARD_COLLABORATION_URI: string;

	@ApiProperty()
	FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: boolean;

	@ApiProperty()
	FEATURE_AI_TUTOR_ENABLED: boolean;

	@ApiProperty()
	FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE: boolean;

	@ApiProperty()
	FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ROOM_COPY_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ROOM_SHARE: boolean;

	@ApiProperty()
	FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_ADMINISTRATE_ROOMS_ENABLED: boolean;

	@ApiProperty()
	FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED: boolean;

	@ApiProperty()
	public FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: boolean;

	@ApiPropertyOptional()
	public LICENSE_SUMMARY_URL?: string;

	@ApiProperty({ type: String, nullable: true })
	ROOM_MEMBER_INFO_URL: string | null;

	@ApiProperty({ type: String, nullable: true })
	ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL: string | null;

	constructor(
		config: ServerPublicApiConfig &
			VideoConferencePublicApiConfig &
			BoardContextPublicApiConfig &
			AlertPublicApiConfig &
			OauthPublicApiConfig &
			BoardPublicApiConfig &
			ProvisioningPublicApiConfig &
			RegistrationPublicApiConfig &
			RosterPublicApiConfig &
			RoomPublicApiConfig &
			SharingPublicApiConfig &
			CommonCartridgePublicApiConfig &
			ToolPublicApiConfig &
			TaskPublicApiConfig &
			LearnroomPublicApiConfig &
			UserPublicApiConfig &
			UserImportPublicApiConfig &
			UserLoginMigrationPublicApiConfig &
			FwuPublicApiConfig &
			RocketChatPublicApiConfig
	) {
		this.ACCESSIBILITY_REPORT_EMAIL = config.accessibilityReportEmail;
		this.SC_CONTACT_EMAIL = config.scContactEmail;
		this.SC_CONTACT_EMAIL_SUBJECT = config.scContactEmailSubject;
		this.ADMIN_TABLES_DISPLAY_CONSENT_COLUMN = config.adminTablesDisplayConsentColumn;
		this.ALERT_STATUS_URL = config.alertStatusUrl;
		this.CALENDAR_SERVICE_ENABLED = config.calendarServiceEnabled;
		this.FEATURE_ES_COLLECTIONS_ENABLED = config.featureEsCollectionsEnabled;
		this.FEATURE_TEAMS_ENABLED = config.featureTeamsEnabled;
		this.FEATURE_LERNSTORE_ENABLED = config.featureLernstoreEnabled;
		this.FEATURE_FWU_CONTENT_ENABLED = config.fwuContentEnabled;
		this.FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED = config.featureAdminToggleStudentLernstoreViewEnabled;
		this.TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE = config.teacherStudentVisibilityIsConfigurable;
		this.TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT = config.teacherStudentVisibilityIsEnabledByDefault;
		this.TEACHER_STUDENT_VISIBILITY__IS_VISIBLE = config.teacherStudentVisibilityIsVisible;
		this.FEATURE_SCHOOL_POLICY_ENABLED_NEW = config.featureSchoolPolicyEnabledNew;
		this.FEATURE_SCHOOL_TERMS_OF_USE_ENABLED = config.featureSchoolTermsOfUseEnabled;
		this.FEATURE_COLUMN_BOARD_ENABLED = config.featureColumnBoardEnabled;
		this.FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED = config.featureColumnBoardSubmissionsEnabled;
		this.FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED =
			config.featureColumnBoardCollaborativeTextEditorEnabled;
		this.FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED = config.featureColumnBoardLinkElementEnabled;
		this.FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED = config.featureColumnBoardExternalToolsEnabled;
		this.FEATURE_COLUMN_BOARD_SHARE = config.featureColumnBoardShare;
		this.FEATURE_COLUMN_BOARD_SOCKET_ENABLED = config.featureColumnBoardSocketEnabled;
		this.FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED = config.featureColumnBoardVideoconferenceEnabled;
		this.FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED = config.featureColumnBoardFileFolderEnabled;
		this.FEATURE_COURSE_SHARE = config.featureCourseShare;
		this.FEATURE_LOGIN_LINK_ENABLED = config.featureLoginLinkEnabled;
		this.FEATURE_LESSON_SHARE = config.featureLessonShare;
		this.FEATURE_TASK_SHARE = config.featureTaskShare;
		this.FEATURE_BOARD_LAYOUT_ENABLED = config.featureBoardLayoutEnabled;
		this.FEATURE_USER_MIGRATION_ENABLED = config.featureUserMigrationEnabled;
		this.FEATURE_COPY_SERVICE_ENABLED = config.featureCopyServiceEnabled;
		this.FEATURE_CONSENT_NECESSARY = config.featureConsentNecessary;
		this.FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED = config.courseExportEnabled;
		this.FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED = config.courseImportEnabled;
		this.FEATURE_USER_LOGIN_MIGRATION_ENABLED = config.featureUserLoginMigrationEnabled;
		this.FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED = config.featureAllowInsecureLdapUrlEnabled;
		this.GHOST_BASE_URL = config.ghostBaseUrl;
		this.ROCKETCHAT_SERVICE_ENABLED = config.rocketChatServiceEnabled;
		this.I18N__AVAILABLE_LANGUAGES = config.availableLanguages;
		this.I18N__DEFAULT_LANGUAGE = config.i18nDefaultLanguage;
		this.I18N__FALLBACK_LANGUAGE = config.i18nFallbackLanguage;
		this.I18N__DEFAULT_TIMEZONE = config.i18nDefaultTimezone;
		this.JWT_SHOW_TIMEOUT_WARNING_SECONDS = config.jwtShowTimeoutWarningSeconds;
		this.JWT_TIMEOUT_SECONDS = config.jwtTimeoutSeconds;
		this.NOT_AUTHENTICATED_REDIRECT_URL = config.notAuthenticatedRedirectUrl;
		this.DOCUMENT_BASE_DIR = config.documentBaseDir;
		this.SC_THEME = config.scTheme;
		this.SC_TITLE = config.scTitle;
		this.TRAINING_URL = config.trainingUrl;
		this.MIGRATION_END_GRACE_PERIOD_MS = config.migrationEndGracePeriodMs;
		this.FEATURE_SHOW_OUTDATED_USERS = config.featureShowOutdatedUsers;
		this.FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION = config.featureEnableLdapSyncDuringMigration;
		this.CTL_TOOLS_RELOAD_TIME_MS = config.ctlToolsReloadTimeMs;
		this.FEATURE_CTL_TOOLS_COPY_ENABLED = config.featureCtlToolsCopyEnabled;
		this.FEATURE_PREFERRED_CTL_TOOLS_ENABLED = config.featurePreferredCtlToolsEnabled;
		this.FEATURE_SHOW_MIGRATION_WIZARD = config.featureShowMigrationWizard;
		this.MIGRATION_WIZARD_DOCUMENTATION_LINK = config.migrationWizardDocumentationLink;
		this.FEATURE_TLDRAW_ENABLED = config.featureTldrawEnabled;
		this.FEATURE_VIDEOCONFERENCE_ENABLED = config.featureVideoConferenceEnabled;
		this.FEATURE_MEDIA_SHELF_ENABLED = config.featureMediaShelfEnabled;
		this.FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED = config.featureSchulconnexCourseSyncEnabled;
		this.BOARD_COLLABORATION_URI = config.boardCollaborationUri;
		this.FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED = config.featureSchulconnexMediaLicenseEnabled;
		this.FEATURE_AI_TUTOR_ENABLED = config.featureAiTutorEnabled;
		this.FEATURE_ADMINISTRATE_ROOMS_ENABLED = config.featureAdministrateRoomsEnabled;
		this.FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE = config.featureBoardReadersCanEditToggle;
		this.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = config.featureExternalPersonRegistrationEnabled;
		this.FEATURE_ROOM_COPY_ENABLED = config.featureRoomCopyEnabled;
		this.FEATURE_ROOM_SHARE = config.featureRoomShare;
		this.FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED = config.featureRoomAddExternalPersonsEnabled;
		this.FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED = config.featureRoomRegisterExternalPersonsEnabled;
		this.FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED = config.featureRoomLinkInvitationExternalPersonsEnabled;
		this.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = config.featureExternalSystemLogoutEnabled;
		this.FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED = config.featureVidisMediaActivationsEnabled;
		this.LICENSE_SUMMARY_URL = config.licenseSummaryUrl;
		this.ROOM_MEMBER_INFO_URL = config.roomMemberInfoUrl;
		this.ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL = config.roomMemberAddExternalPersonRequirementsUrl;
		this.FEATURE_COLUMN_BOARD_H5P_ENABLED = config.featureColumnBoardH5pEnabled;
		this.FEATURE_COLUMN_BOARD_COLLABORA_ENABLED = config.featureColumnBoardCollaboraEnabled;
	}
}
