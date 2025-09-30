import { ConfigProperty, Configuration } from '@infra/configuration';
import { LanguageType } from '@shared/domain/interface';
import { SchulcloudTheme } from '@shared/domain/types';
import { IsEmail } from 'class-validator';
import { Timezone } from './types/timezone.enum';

@Configuration()
export class ApplicationSettingsConfig {
	@ConfigProperty()
	@IsEmail()
	public ACCESSIBILITY_REPORT_EMAIL!: string;

	@ConfigProperty()
	@IsEmail()
	public SC_CONTACT_EMAIL!: string;

	@ConfigProperty()
	public MIGRATION_END_GRACE_PERIOD_MS!: number;

	@ConfigProperty()
	public FEATURE_SHOW_OUTDATED_USERS!: boolean;

	@ConfigProperty()
	public FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION!: boolean;

	@ConfigProperty()
	public CTL_TOOLS_RELOAD_TIME_MS!: number;

	@ConfigProperty()
	public FEATURE_CTL_TOOLS_COPY_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_PREFERRED_CTL_TOOLS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_SHOW_MIGRATION_WIZARD!: boolean;

	@ConfigProperty()
	public MIGRATION_WIZARD_DOCUMENTATION_LINK!: string;

	@ConfigProperty()
	public FEATURE_TLDRAW_ENABLED!: boolean;

	@ConfigProperty()
	public ADMIN_TABLES_DISPLAY_CONSENT_COLUMN!: boolean;

	@ConfigProperty()
	public ALERT_STATUS_URL!: string | null;

	@ConfigProperty()
	public FEATURE_ES_COLLECTIONS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_EXTENSIONS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_TEAMS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_LERNSTORE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED!: boolean;

	@ConfigProperty()
	public TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE!: boolean;

	@ConfigProperty()
	public TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT!: boolean;

	@ConfigProperty()
	public TEACHER_STUDENT_VISIBILITY__IS_VISIBLE!: boolean;

	@ConfigProperty()
	public FEATURE_SCHOOL_POLICY_ENABLED_NEW!: boolean;

	@ConfigProperty()
	public FEATURE_SCHOOL_TERMS_OF_USE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_VIDEOCONFERENCE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_SHARE!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_SOCKET_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_H5P_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COLUMN_BOARD_COLLABORA_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COURSE_SHARE!: boolean;

	@ConfigProperty()
	public FEATURE_LOGIN_LINK_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_LESSON_SHARE!: boolean;

	@ConfigProperty()
	public FEATURE_TASK_SHARE!: boolean;

	@ConfigProperty()
	public FEATURE_BOARD_LAYOUT_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_USER_MIGRATION_ENABLED!: boolean;

	@ConfigProperty()
	public CALENDAR_SERVICE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COPY_SERVICE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_CONSENT_NECESSARY!: boolean;

	@ConfigProperty()
	public FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_USER_LOGIN_MIGRATION_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED!: boolean;

	@ConfigProperty()
	public GHOST_BASE_URL!: string;

	@ConfigProperty()
	public ROCKETCHAT_SERVICE_ENABLED!: boolean;

	@ConfigProperty()
	public I18N__AVAILABLE_LANGUAGES!: LanguageType[];

	@ConfigProperty()
	public I18N__DEFAULT_LANGUAGE!: LanguageType;

	@ConfigProperty()
	public I18N__FALLBACK_LANGUAGE!: LanguageType;

	@ConfigProperty()
	public I18N__DEFAULT_TIMEZONE!: Timezone;

	@ConfigProperty()
	public JWT_SHOW_TIMEOUT_WARNING_SECONDS!: number;

	@ConfigProperty()
	public JWT_TIMEOUT_SECONDS!: number;

	@ConfigProperty()
	public NOT_AUTHENTICATED_REDIRECT_URL!: string;

	@ConfigProperty()
	public DOCUMENT_BASE_DIR!: string;

	@ConfigProperty()
	public SC_THEME!: SchulcloudTheme;

	@ConfigProperty()
	public SC_TITLE!: string;

	@ConfigProperty()
	public TRAINING_URL!: string;

	@ConfigProperty()
	public FEATURE_MEDIA_SHELF_ENABLED!: boolean;

	@ConfigProperty()
	public BOARD_COLLABORATION_URI!: string;

	@ConfigProperty()
	public FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_AI_TUTOR_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE!: boolean;

	@ConfigProperty()
	public FEATURE_ROOM_COPY_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_ROOM_SHARE!: boolean;

	@ConfigProperty()
	public FEATURE_ADMINISTRATE_ROOMS_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED!: boolean;

	@ConfigProperty()
	public FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED!: boolean;

	@ConfigProperty('LICENSE_SUMMARY_URI')
	public LICENSE_SUMMARY_URL!: string;

	@ConfigProperty()
	public ROOM_MEMBER_INFO_URL!: string | null;
}
