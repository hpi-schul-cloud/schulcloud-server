const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');
const { MikroOrmModule } = require('@mikro-orm/nestjs');
const { ConfigModule } = require('@nestjs/config');

// run 'npm run nest:build' for the following imports to work,
// this is a workaround to make TypeScript modules available in JavaScript
const { defineConfig } = require('@mikro-orm/mongodb');
const { AccountApiModule } = require('../../dist/apps/server/modules/account/account-api.module');
const { AccountUc } = require('../../dist/apps/server/modules/account/api/account.uc');
const { AccountService } = require('../../dist/apps/server/modules/account/domain/services/account.service');
const { DB_PASSWORD, DB_URL, DB_USERNAME } = require('../../dist/apps/server/imports-from-feathers');
const { TeamService } = require('../../dist/apps/server/modules/teams/service/team.service');
const { TeamsApiModule } = require('../../dist/apps/server/modules/teams/teams-api.module');
const { AuthorizationModule } = require('../../dist/apps/server/modules/authorization');
const { SystemRule, AuthorizationRulesModule } = require('../../dist/apps/server/modules/authorization-rules');
const { createConfigModuleOptions } = require('../../dist/apps/server/shared/common/config-module-options');
const { serverConfig } = require('../../dist/apps/server/modules/server/server.config');

const { AccountEntity } = require('../../dist/apps/server/modules/account/domain/entity/account.entity');
const { SchoolSystemOptionsEntity } = require('../../dist/apps/server/modules/legacy-school/entity');
const {
	SystemEntity,
	OauthConfigEntity,
	OidcConfigEntity,
	LdapConfigEntity,
	ExternalSourceEmbeddable,
} = require('../../dist/apps/server/modules/system/entity');
const {
	CountyEmbeddable,
	FederalStateEntity,
} = require('../../dist/apps/server/shared/domain/entity/federal-state.entity');
const { Role } = require('../../dist/apps/server/shared/domain/entity/role.entity');
const {
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
} = require('../../dist/apps/server/shared/domain/entity/school.entity');
const { SchoolYearEntity } = require('../../dist/apps/server/shared/domain/entity/schoolyear.entity');
const { StorageProviderEntity } = require('../../dist/apps/server/shared/domain/entity/storageprovider.entity');
const { UserLoginMigrationEntity } = require('../../dist/apps/server/shared/domain/entity/user-login-migration.entity');
const { UserSchoolEmbeddable } = require('../../dist/apps/server/shared/domain/entity/user.entity');
const {
	ConsentEntity,
	UserConsentEntity,
	ParentConsentEntity,
} = require('../../dist/apps/server/shared/domain/entity');
const { UserParentsEntity } = require('../../dist/apps/server/shared/domain/entity/user-parents.entity');
const { UserSourceOptionsEntity } = require('../../dist/apps/server/shared/domain/entity/user-source-options-entity');

const { Course } = require('../../dist/apps/server/shared/domain/entity/course.entity');
const { CourseGroup } = require('../../dist/apps/server/shared/domain/entity/coursegroup.entity');
const { ClassEntity, ClassSourceOptionsEntity } = require('../../dist/apps/server/modules/class/entity');
const {
	GroupEntity,
	GroupUserEmbeddable,
	GroupValidPeriodEmbeddable,
} = require('../../dist/apps/server/modules/group/entity');

const {
	ContextExternalToolService,
} = require('../../dist/apps/server/modules/tool/context-external-tool/service/context-external-tool.service');
const { ColumnBoardService } = require('../../dist/apps/server/modules/board/service/column-board.service');
const {
	CollaborativeStorageUc,
} = require('../../dist/apps/server/modules/collaborative-storage/uc/collaborative-storage.uc');
const { FeathersRosterService } = require('../../dist/apps/server/modules/roster/service/feathers-roster.service');
const { GroupService } = require('../../dist/apps/server/modules/group/service/group.service');
const { RocketChatService } = require('../../dist/apps/server/modules/rocketchat/rocket-chat.service');

const ENTITIES = {
	Role,
	SchoolYearEntity,
	SchoolRoles,
	SchoolRolePermission,
	UserLoginMigrationEntity,
	SystemEntity,
	SchoolEntity,
	SchoolSystemOptionsEntity,
	FederalStateEntity,
	CountyEmbeddable,
	StorageProviderEntity,
	ConsentEntity,
	UserConsentEntity,
	ParentConsentEntity,
	UserParentsEntity,
	UserSourceOptionsEntity,
	UserSchoolEmbeddable,
	AccountEntity,
	OauthConfigEntity,
	OidcConfigEntity,
	LdapConfigEntity,
	ExternalSourceEmbeddable,
	Course,
	CourseGroup,
	ClassEntity,
	ClassSourceOptionsEntity,
	GroupEntity,
	GroupUserEmbeddable,
	GroupValidPeriodEmbeddable,
};

const setupNestServices = async (app) => {
	const module = await Test.createTestingModule({
		imports: [
			MikroOrmModule.forRoot(
				defineConfig({
					type: 'mongo',
					clientUrl: DB_URL,
					password: DB_PASSWORD,
					user: DB_USERNAME,
					entities: ['dist/apps/server/modules/**/*.entity.js', 'dist/apps/server/shared/domain/entity/*.entity.js'],
					// entitiesTs: ['apps/server/src/modules/**/*.entity.ts', 'apps/server/src/shared/domain/entity/*.entity.ts'],
					allowGlobalContext: true,
					debug: false, // use it for locally debugging of querys
				})
			),
			ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
			AccountApiModule,
			TeamsApiModule,
			AuthorizationModule,
			AuthorizationRulesModule,
		],
	}).compile();
	const nestApp = await module.createNestApplication().init();
	const orm = nestApp.get(MikroORM);
	const accountUc = nestApp.get(AccountUc);
	const accountService = nestApp.get(AccountService);
	const contextExternalToolService = nestApp.get(ContextExternalToolService);
	const columnBoardService = nestApp.get(ColumnBoardService);
	const collaborativeStorageUc = nestApp.get(CollaborativeStorageUc);
	const feathersRosterService = nestApp.get(FeathersRosterService);
	const groupService = nestApp.get(GroupService);
	const rocketChatService = nestApp.get(RocketChatService);
	const teamService = nestApp.get(TeamService);
	const systemRule = nestApp.get(SystemRule);

	// app.services['nest-mail'] = ??
	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;
	app.services['nest-context-external-tool-service'] = contextExternalToolService;
	app.services['nest-column-board-service'] = columnBoardService;
	app.services['nest-collaborative-storage-uc'] = collaborativeStorageUc;
	app.services['nest-feathers-roster-service'] = feathersRosterService;
	app.services['nest-group-service'] = groupService;
	app.services['nest-rocket-chat'] = rocketChatService;
	app.services['nest-team-service'] = teamService;
	app.services['nest-system-rule'] = systemRule;
	app.services['nest-orm'] = orm;
	console.log(nestApp);
	return { nestApp, orm, accountUc, accountService };
};

const closeNestServices = async (nestServices) => {
	const { nestApp, orm } = nestServices;
	await orm.close();
	await nestApp.close();
};

module.exports = {
	setupNestServices,
	closeNestServices,
};
