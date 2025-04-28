import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
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
				'CALENDAR_SERVICE_ENABLED',
				'DOCUMENT_BASE_DIR',
				'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED',
				'FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED',
				'FEATURE_COLUMN_BOARD_ENABLED',
				'FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED',
				'FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED',
				'FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED',
				'FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED',
				'FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED',
				'FEATURE_COLUMN_BOARD_SHARE',
				'FEATURE_COLUMN_BOARD_SOCKET_ENABLED',
				'FEATURE_COLUMN_BOARD_VIDEOCONFERENCE_ENABLED',
				'FEATURE_BOARD_LAYOUT_ENABLED',
				'FEATURE_CONSENT_NECESSARY',
				'FEATURE_COPY_SERVICE_ENABLED',
				'FEATURE_COURSE_SHARE',
				'FEATURE_CTL_TOOLS_COPY_ENABLED',
				'FEATURE_PREFERRED_CTL_TOOLS_ENABLED',
				'FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION',
				'FEATURE_ES_COLLECTIONS_ENABLED',
				'FEATURE_EXTENSIONS_ENABLED',
				'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED',
				'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED',
				'FEATURE_LERNSTORE_ENABLED',
				'FEATURE_LESSON_SHARE',
				'FEATURE_LOGIN_LINK_ENABLED',
				'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED',
				'FEATURE_SCHOOL_POLICY_ENABLED_NEW',
				'FEATURE_USER_LOGIN_MIGRATION_ENABLED',
				'FEATURE_SCHOOL_TERMS_OF_USE_ENABLED',
				'FEATURE_SHOW_MIGRATION_WIZARD',
				'FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED',
				'FEATURE_SHOW_NEW_ROOMS_VIEW_ENABLED',
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
				'SC_CONTACT_EMAIL',
				'TRAINING_URL',
				'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE',
				'TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT',
				'TEACHER_STUDENT_VISIBILITY__IS_VISIBLE',
				'FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED',
				'FEATURE_MEDIA_SHELF_ENABLED',
				'BOARD_COLLABORATION_URI',
				'FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED',
				'FEATURE_AI_TUTOR_ENABLED',
				'FEATURE_ROOMS_ENABLED',
				'FEATURE_ROOM_INVITATION_LINKS_ENABLED',
				'FEATURE_ROOMS_CHANGE_PERMISSIONS_ENABLED',
				'FEATURE_ROOM_MEMBERS_TABS_ENABLED',
				'FEATURE_ROOMS_DUPLICATION_ENABLED',
				'FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED',
				'FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED',
				'LICENSE_SUMMARY_URL',
				'FEATURE_COLUMN_BOARD_H5P_ENABLED',
				'ROOM_MEMBER_INFO_URL',
			];

			expect(response.status).toEqual(HttpStatus.OK);
			expect(Object.keys(response.body as Record<string, unknown>).sort()).toEqual(expectedResultKeys.sort());
		});
	});
});
