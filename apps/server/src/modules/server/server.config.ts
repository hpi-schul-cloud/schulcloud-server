import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { LanguageType } from '@shared/domain/interface';
import { SchulcloudTheme } from '@shared/domain/types';
import { IsBoolean, IsEmail, IsEnum, IsNumber, IsString, IsUrl } from 'class-validator';
import { Timezone } from './types/timezone.enum';

export const SERVER_PUBLIC_API_CONFIG_TOKEN = 'SERVER_PUBLIC_API_CONFIG_TOKEN';

// Environment keys should be added over configs from modules, directly adding is only allowed for general server configs
@Configuration()
export class ServerPublicApiConfig {
	@ConfigProperty('ACCESSIBILITY_REPORT_EMAIL')
	@IsEmail()
	public accessibilityReportEmail = 'dbildungscloud@dataport.de';

	@ConfigProperty('SC_CONTACT_EMAIL')
	@IsEmail()
	public scContactEmail = 'ticketsystem@dbildungscloud.de';

	@ConfigProperty('SC_CONTACT_EMAIL_SUBJECT')
	@IsString()
	public scContactEmailSubject = 'Bildungscloud Anfrage';

	@ConfigProperty('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN')
	@StringToBoolean()
	@IsBoolean()
	public adminTablesDisplayConsentColumn = true;

	@ConfigProperty('FEATURE_ES_COLLECTIONS_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureEsCollectionsEnabled = false;

	@ConfigProperty('FEATURE_TEAMS_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureTeamsEnabled = true;

	@ConfigProperty('FEATURE_LERNSTORE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureLernstoreEnabled = true;

	@ConfigProperty('FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureAdminToggleStudentLernstoreViewEnabled = true;

	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_VISIBLE')
	@StringToBoolean()
	@IsBoolean()
	public teacherStudentVisibilityIsVisible = true;

	@ConfigProperty('FEATURE_SCHOOL_POLICY_ENABLED_NEW')
	@StringToBoolean()
	@IsBoolean()
	public featureSchoolPolicyEnabledNew = false;

	@ConfigProperty('FEATURE_SCHOOL_TERMS_OF_USE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchoolTermsOfUseEnabled = false;

	@ConfigProperty('FEATURE_BOARD_LAYOUT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureBoardLayoutEnabled = true;

	@ConfigProperty('FEATURE_CONSENT_NECESSARY')
	@StringToBoolean()
	@IsBoolean()
	public featureConsentNecessary = true;

	@ConfigProperty('FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureAllowInsecureLdapUrlEnabled = false;

	@ConfigProperty('GHOST_BASE_URL')
	@IsUrl({ require_tld: false })
	public ghostBaseUrl = 'https://blog.dbildungscloud.de';

	@ConfigProperty('JWT_SHOW_TIMEOUT_WARNING_SECONDS')
	@IsNumber()
	@StringToNumber()
	public jwtShowTimeoutWarningSeconds = 3600;

	@ConfigProperty('JWT_TIMEOUT_SECONDS')
	@IsNumber()
	@StringToNumber()
	public jwtTimeoutSeconds = 7200;

	@ConfigProperty('NOT_AUTHENTICATED_REDIRECT_URL')
	@IsString()
	public notAuthenticatedRedirectUrl = '/login';

	@ConfigProperty('DOCUMENT_BASE_DIR')
	@IsString()
	public documentBaseDir = 'https://s3.hidrive.strato.com/cloud-instances/';

	@ConfigProperty('SC_THEME')
	@IsEnum(SchulcloudTheme)
	public scTheme = SchulcloudTheme.DEFAULT;

	@ConfigProperty('SC_TITLE')
	@IsString()
	public scTitle = 'dBildungscloud';

	@ConfigProperty('TRAINING_URL')
	@IsUrl({ require_tld: false })
	public trainingUrl = 'https://lernen.dbildungscloud.de';

	@ConfigProperty('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION')
	@StringToBoolean()
	@IsBoolean()
	public featureEnableLdapSyncDuringMigration = false;

	@ConfigProperty('I18N__DEFAULT_LANGUAGE')
	@IsEnum(LanguageType)
	public i18nDefaultLanguage = LanguageType.DE;

	@ConfigProperty('I18N__FALLBACK_LANGUAGE')
	@IsEnum(LanguageType)
	public i18nFallbackLanguage = LanguageType.DE;

	@ConfigProperty('I18N__DEFAULT_TIMEZONE')
	@IsEnum(Timezone)
	public i18nDefaultTimezone = Timezone.EUROPE_BERLIN;

	@ConfigProperty('FEATURE_AI_TUTOR_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureAiTutorEnabled = false;

	@ConfigProperty('LICENSE_SUMMARY_URL')
	@IsUrl({ require_tld: false })
	public licenseSummaryUrl?: string;
}
