import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const repoRoot = path.resolve(__dirname, '../../../../..');
const legacyListPath = path.join(repoRoot, 'eslint.legacy-loggables.js');

// Snapshot of eslint.legacy-loggables.js when the lint rule was added (SVSDEV-345).
// The list may only shrink. Never add an entry here: new log messages use logger.info('message', data).
const ALLOWED_LEGACY_LOGGABLES = new Set([
	'apps/server/src/apps/helpers/app-start-loggable.ts',
	'apps/server/src/apps/helpers/metrics.server.ts',
	'apps/server/src/infra/bilo-client/loggable/bilo-media-query-bad-response.loggable.ts',
	'apps/server/src/infra/common-cartridge-clients/loggables/generic-file-storage-adapter.loggable.ts',
	'apps/server/src/infra/error/loggable/error.loggable.ts',
	'apps/server/src/infra/mail/loggable/recipient-addresses-empty.loggable.ts',
	'apps/server/src/infra/mail/loggable/send-email.loggable.ts',
	'apps/server/src/infra/rabbitmq/loggable/amqp-connection-lost.loggable.ts',
	'apps/server/src/infra/s3-client/loggable/s3-client-action.loggable.ts',
	'apps/server/src/infra/valkey-client/loggable/discover-sentinal.loggable.ts',
	'apps/server/src/modules/authentication/loggable/shd-user-create-token.loggable.ts',
	'apps/server/src/modules/authentication/loggable/user-authenticated.loggable.ts',
	'apps/server/src/modules/common-cartridge/loggable/common-cartridge-message.loggable.ts',
	'apps/server/src/modules/course/domain/loggable/course-synchronization-stopped.loggable.ts',
	'apps/server/src/modules/erwin-identifier/domain/loggable/erwin-identifier.loggable.ts',
	'apps/server/src/modules/files/domain/loggable/create-archive.loggable.ts',
	'apps/server/src/modules/files/domain/loggable/skip-file.loggable.ts',
	'apps/server/src/modules/idp-console/api/loggable/progress-synchronization-loggable.ts',
	'apps/server/src/modules/idp-console/api/loggable/start-synchronization-loggable.ts',
	'apps/server/src/modules/idp-console/api/loggable/sucess-synchronization-loggable.ts',
	'apps/server/src/modules/ldap-sync-console/api/loggable/ldap-sync.loggable.ts',
	'apps/server/src/modules/media-source-sync/loggable/school-for-media-activation-sync-not-found-loggable.ts',
	'apps/server/src/modules/media-sync-console/loggable/media-metadata-sync-report.loggable.ts',
	'apps/server/src/modules/news/domain/loggable/news-crud-operation.loggable.ts',
	'apps/server/src/modules/notification/domain/loggable/notification-loggable.ts',
	'apps/server/src/modules/provisioning/loggable/external-tool-created.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/external-tool-metadata-update-failed.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/external-tool-provisioning-failed.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/fetching-policies-info-failed.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/group-provisioning-info.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/group-provisioning-successful.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/group-removal-successful.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/group-role-unknown.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/license-media-source-missing.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/license-provisioning-successful.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/policies-info-error-response-loggable.ts',
	'apps/server/src/modules/provisioning/loggable/school-external-tool-created.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/school-for-group-not-found.loggable.ts',
	'apps/server/src/modules/provisioning/loggable/tsp-class-without-name.loggable-exception.ts',
	'apps/server/src/modules/provisioning/loggable/user-for-group-not-found.loggable.ts',
	'apps/server/src/modules/registration/domain/error/resend-registration-mail.loggable.ts',
	'apps/server/src/modules/runtime-config-api/api/loggable/update-runtime-config.loggable.ts',
	'apps/server/src/modules/saga/loggable/user-deletion-step-operation.loggable.ts',
	'apps/server/src/modules/school-license/loggable/build-media-school-license-failed.loggable.ts',
	'apps/server/src/modules/tool/external-tool/loggable/external-tool-logo-fetched-loggable.ts',
	'apps/server/src/modules/tsp-sync/errors/invalid-target.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-class-sync-batch.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-class-sync-start.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-class-sync-summary.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-data-fetched.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-data-sync-batch-finished.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-missing-external-id.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-schools-fetched.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-schools-synced.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-schulnummer-missing.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-sync-disabled.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-synced-users.loggable.ts',
	'apps/server/src/modules/tsp-sync/strategy/tsp/loggable/tsp-syncing-users.loggable.ts',
	'apps/server/src/modules/user-import/loggable/migration-is-not-completed.loggable.ts',
	'apps/server/src/modules/user-import/loggable/migration-may-be-completed.loggable.ts',
	'apps/server/src/modules/user-import/loggable/school-id-does-not-match-with-user-school-id.loggable.ts',
	'apps/server/src/modules/user-import/loggable/school-in-user-migration-end.loggable.ts',
	'apps/server/src/modules/user-import/loggable/school-in-user-migration-start.loggable.ts',
	'apps/server/src/modules/user-import/loggable/user-already-migrated.loggable.ts',
	'apps/server/src/modules/user-import/loggable/user-migration-canceled.loggable.ts',
	'apps/server/src/modules/user-import/loggable/user-migration-failed.loggable.ts',
	'apps/server/src/modules/user-import/loggable/user-migration-not-enable.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/debug/school-migration-successful.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/debug/user-migration-correction-successful-loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/debug/user-migration-started.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/debug/user-migration-successful.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/user-login-migration-mandatory.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/user-login-migration-start.loggable.ts',
	'apps/server/src/modules/user-login-migration/domain/loggable/user-migration-rollback-successful.loggable.ts',
	'apps/server/src/shared/common/loggable/referenced-entity-not-found-loggable.ts',
]);

const readLegacyList = (): string[] => {
	const content = fs.readFileSync(legacyListPath, 'utf8');

	return [...content.matchAll(/'([^']+\.ts)'/g)].map((match) => match[1]);
};

// Same condition as the lint rule: a class without superclass that implements Loggable.
const hasPlainLoggableClass = (filePath: string): boolean => {
	const sourceFile = ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest);

	return sourceFile.statements.some((statement) => {
		if (!ts.isClassDeclaration(statement) || !statement.heritageClauses) {
			return false;
		}
		const extendsClause = statement.heritageClauses.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
		const implementsClause = statement.heritageClauses.find(
			(clause) => clause.token === ts.SyntaxKind.ImplementsKeyword
		);

		return (
			!extendsClause &&
			!!implementsClause?.types.some((type) => ts.isIdentifier(type.expression) && type.expression.text === 'Loggable')
		);
	});
};

describe('eslint.legacy-loggables.js', () => {
	const legacyList = readLegacyList();

	it('should only contain files that were legacy loggables when the lint rule was added', () => {
		const newEntries = legacyList.filter((file) => !ALLOWED_LEGACY_LOGGABLES.has(file));

		expect(newEntries).toEqual([]);
	});

	it('should not contain duplicates', () => {
		expect(new Set(legacyList).size).toBe(legacyList.length);
	});

	it('should only contain files that still have a Loggable class', () => {
		const staleEntries = legacyList.filter((file) => {
			const filePath = path.join(repoRoot, file);

			return !fs.existsSync(filePath) || !hasPlainLoggableClass(filePath);
		});

		expect(staleEntries).toEqual([]);
	});
});
