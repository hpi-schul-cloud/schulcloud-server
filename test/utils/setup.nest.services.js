const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');
const { MikroOrmModule } = require('@mikro-orm/nestjs');
const { ConfigModule } = require('@nestjs/config');

// run 'npm run nest:build' for the following imports to work,
// this is a workaround to make TypeScript modules available in JavaScript
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

// TODO: Imports
const { AccountEntity } = require('../../dist/apps/server/modules/account/domain/entity/account.entity');
const { BoardNodeEntity } = require('../../dist/apps/server/modules/board/repo/entity');
const { DeletionLogEntity } = require('../../dist/apps/server/modules/deletion/repo/entity/deletion-log.entity');
const {
	DeletionRequestEntity,
} = require('../../dist/apps/server/modules/deletion/repo/entity/deletion-request.entity');
const { InstanceEntity } = require('../../dist/apps/server/modules/instance');
const { SchoolSystemOptionsEntity } = require('../../dist/apps/server/modules/legacy-school/entity');
const { OauthSessionTokenEntity } = require('../../dist/apps/server/modules/oauth/entity');
const { PseudonymEntity } = require('../../dist/apps/server/modules/pseudonym/entity');
const { RegistrationPinEntity } = require('../../dist/apps/server/modules/registration-pin/entity');
const { RocketChatUserEntity } = require('../../dist/apps/server/modules/rocketchat-user/entity');
const { ShareToken } = require('../../dist/apps/server/modules/sharing/entity/share-token.entity');
const { SystemEntity } = require('../../dist/apps/server/modules/system/entity/system.entity');
const { TldrawDrawing } = require('../../dist/apps/server/modules/tldraw/entities');
const {
	ContextExternalToolEntity,
	LtiDeepLinkTokenEntity,
} = require('../../dist/apps/server/modules/tool/context-external-tool/entity');
const { SchoolExternalToolEntity } = require('../../dist/apps/server/modules/tool/school-external-tool/entity');
const { ImportUser } = require('../../dist/apps/server/modules/user-import/entity');
const { MediaSourceEntity, UserLicenseEntity } = require('../../dist/apps/server/modules/user-license/entity');
const { RoomMemberEntity } = require('../../dist/apps/server/modules/room-member/repo/entity/room-member.entity');
const { ColumnBoardNode } = require('../../dist/apps/server/shared/column-board-node.entity');
const { Course } = require('../../dist/apps/server/shared/course.entity');
const { CourseGroup } = require('../../dist/apps/server/shared/coursegroup.entity');
const { DashboardGridElementModel, DashboardModelEntity } = require('../../dist/apps/server/shared/dashboard.model.entity');
const { CountyEmbeddable, FederalStateEntity } = require('../../dist/apps/server/shared/federal-state.entity');
const { LegacyBoard, LegacyBoardElement } = require('../../dist/apps/server/shared/legacy-board');
const { LessonEntity } = require('../../dist/apps/server/shared/lesson.entity');
const { LtiTool } = require('../../dist/apps/server/shared/ltitool.entity');
const { Material } = require('../../dist/apps/server/shared/materials.entity');
const { News } = require('../../dist/apps/server/shared/news.entity');
const { Role } = require('../../dist/apps/server/shared/role.entity');
const { SchoolEntity, SchoolRolePermission, SchoolRoles } = require('../../dist/apps/server/shared/school.entity');
const { SchoolYearEntity } = require('../../dist/apps/server/shared/schoolyear.entity');
const { StorageProviderEntity } = require('../../dist/apps/server/shared/storageprovider.entity');
const { Submission } = require('../../dist/apps/server/shared/submission.entity');
const { Task } = require('../../dist/apps/server/shared/task.entity');
const { TeamEntity, TeamUserEntity } = require('../../dist/apps/server/shared/team.entity');
const { UserLoginMigrationEntity } = require('../../dist/apps/server/shared/user-login-migration.entity');
const { User } = require('../../dist/apps/server/shared/user.entity');
const { VideoConference } = require('../../dist/apps/server/shared/video-conference.entity');

const ALL_ENTITIES = [
	AccountEntity,
	LegacyBoard,
	LegacyBoardElement,
	BoardNodeEntity,
	ColumnBoardNode,
	DeletionRequestEntity,
	DeletionLogEntity,
	ContextExternalToolEntity,
	CountyEmbeddable,
	Course,
	CourseGroup,
	News,
	DashboardGridElementModel,
	DashboardModelEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LtiTool,
	Material,
	PseudonymEntity,
	RocketChatUserEntity,
	Role,
	RoomMemberEntity,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolSystemOptionsEntity,
	SchoolYearEntity,
	ShareToken,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TeamEntity,
	TeamUserEntity,
	User,
	UserLoginMigrationEntity,
	VideoConference,
	RegistrationPinEntity,
	TldrawDrawing,
	UserLicenseEntity,
	InstanceEntity,
	MediaSourceEntity,
	OauthSessionTokenEntity,
	LtiDeepLinkTokenEntity,
];

const setupNestServices = async (app) => {
	const module = await Test.createTestingModule({
		imports: [
			MikroOrmModule.forRoot({
				type: 'mongo',
				clientUrl: DB_URL,
				password: DB_PASSWORD,
				user: DB_USERNAME,
				entities: ALL_ENTITIES,
				allowGlobalContext: true,
				// debug: true, // use it for locally debugging of querys
			}),
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
	const teamService = nestApp.get(TeamService);
	const systemRule = nestApp.get(SystemRule);

	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;
	app.services['nest-team-service'] = teamService;
	app.services['nest-system-rule'] = systemRule;
	app.services['nest-orm'] = orm;

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
