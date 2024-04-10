import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@shared/testing';
import { ConfigResponse } from '../dto';

describe('Server Controller (API)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		testApiClient = new TestApiClient(app, '');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] /', () => {
		it('should be return string', async () => {
			const response = await testApiClient.get('/');

			expect(response.body).toEqual({ message: 'Schulcloud Server API' });
		});
	});

	describe('[GET] /config/public', () => {
		it('should be return configuration as json with all required keys', async () => {
			const response = await testApiClient.get('/config/public');
			const expectedResultKeys: (keyof ConfigResponse)[] = [
				'ACCESSIBILITY_REPORT_EMAIL',
				'ADMIN_TABLES_DISPLAY_CONSENT_COLUMN',
				'ALERT_STATUS_URL',
				'CTL_TOOLS_RELOAD_TIME_MS',
				'DOCUMENT_BASE_DIR',
				'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED',
				'FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED',
				'FEATURE_COLUMN_BOARD_ENABLED',
				'FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED',
				'FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED',
				'FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED',
				'FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED',
				'FEATURE_COLUMN_BOARD_SHARE',
				'FEATURE_CONSENT_NECESSARY',
				'FEATURE_COPY_SERVICE_ENABLED',
				'FEATURE_COURSE_SHARE',
				'FEATURE_CTL_CONTEXT_CONFIGURATION_ENABLED',
				'FEATURE_CTL_TOOLS_COPY_ENABLED',
				'FEATURE_CTL_TOOLS_TAB_ENABLED',
				'FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION',
				'FEATURE_ES_COLLECTIONS_ENABLED',
				'FEATURE_EXTENSIONS_ENABLED',
				'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED',
				'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED',
				'FEATURE_LERNSTORE_ENABLED',
				'FEATURE_LESSON_SHARE',
				'FEATURE_LOGIN_LINK_ENABLED',
				'FEATURE_LTI_TOOLS_TAB_ENABLED',
				'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED',
				'FEATURE_NEXBOARD_COPY_ENABLED',
				'FEATURE_SCHOOL_POLICY_ENABLED_NEW',
				'FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED',
				'FEATURE_SCHOOL_TERMS_OF_USE_ENABLED',
				'FEATURE_SHOW_MIGRATION_WIZARD',
				'FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED',
				'FEATURE_SHOW_OUTDATED_USERS',
				'FEATURE_TASK_SHARE',
				'FEATURE_TEAMS_ENABLED',
				'FEATURE_TLDRAW_ENABLED',
				'FEATURE_USER_MIGRATION_ENABLED',
				'FEATURE_VIDEOCONFERENCE_ENABLED',
				'GHOST_BASE_URL',
				'I18N__AVAILABLE_LANGUAGES',
				'I18N__DEFAULT_LANGUAGE',
				'I18N__DEFAULT_TIMEZONE',
				'I18N__FALLBACK_LANGUAGE',
				'JWT_SHOW_TIMEOUT_WARNING_SECONDS',
				'JWT_TIMEOUT_SECONDS',
				'MIGRATION_END_GRACE_PERIOD_MS',
				'NOT_AUTHENTICATED_REDIRECT_URL',
				'ROCKETCHAT_SERVICE_ENABLED',
				'SC_THEME',
				'SC_TITLE',
				'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE',
				'TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT',
				'TEACHER_STUDENT_VISIBILITY__IS_VISIBLE',
				'TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST',
				'TLDRAW__ASSETS_ENABLED',
				'TLDRAW__ASSETS_MAX_SIZE',
				'FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED',
				'FEATURE_MEDIA_SHELF_ENABLED',
			];

			expect(response.status).toEqual(HttpStatus.OK);
			expect(Object.keys(response.body as Record<string, unknown>).sort()).toEqual(expectedResultKeys.sort());
		});
	});
});
