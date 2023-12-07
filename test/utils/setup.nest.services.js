const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');
const { MikroOrmModule } = require('@mikro-orm/nestjs');
const { ConfigModule } = require('@nestjs/config');

// run 'npm run nest:build' for the following imports to work,
// this is a workaround to make TypeScript modules available in JavaScript
const { AccountApiModule } = require('../../dist/apps/server/modules/account/account-api.module');
const { AccountUc } = require('../../dist/apps/server/modules/account/uc/account.uc');
const { AccountService } = require('../../dist/apps/server/modules/account/services/account.service');
const {
	AccountValidationService,
} = require('../../dist/apps/server/modules/account/services/account.validation.service');
const { DB_PASSWORD, DB_URL, DB_USERNAME } = require('../../dist/apps/server/config/database.config');
const { TeamService } = require('../../dist/apps/server/modules/teams/service/team.service');
const { TeamsApiModule } = require('../../dist/apps/server/modules/teams/teams-api.module');
const { AuthorizationModule } = require('../../dist/apps/server/modules/authorization');
const { SystemRule } = require('../../dist/apps/server/modules/authorization');

const { ClassEntity } = require('../../dist/apps/server/modules/class/entity');
const { GroupEntity } = require('../../dist/apps/server/modules/group/entity');
const { ExternalToolPseudonymEntity, PseudonymEntity } = require('../../dist/apps/server/modules/pseudonym/entity');
const { RegistrationPinEntity } = require('../../dist/apps/server/modules/registration-pin/entity');
const { ShareToken } = require('../../dist/apps/server/modules/sharing/entity/share-token.entity');
const { ContextExternalToolEntity } = require('../../dist/apps/server/modules/tool/context-external-tool/entity');
const { ExternalToolEntity } = require('../../dist/apps/server/modules/tool/external-tool/entity');
const { SchoolExternalToolEntity } = require('../../dist/apps/server/modules/tool/school-external-tool/entity');
const {
	Account,
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	ExternalToolElementNodeEntity,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	Course,
	CourseGroup,
	DashboardGridElementModel,
	DashboardModelEntity,
	FederalStateEntity,
	ImportUser,
	Board,
	BoardElement,
	ColumnboardBoardElement,
	ColumnBoardTarget,
	LessonBoardElement,
	TaskBoardElement,
	LessonEntity,
	LtiTool,
	Material,
	CourseNews,
	News,
	SchoolNews,
	TeamNews,
	Role,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TeamEntity,
	TeamUserEntity,
	UserLoginMigrationEntity,
	User,
	VideoConference,
} = require('../../dist/apps/server/shared/domain/entity');

const entities = [
	Account,
	Board,
	BoardElement,
	BoardNode,
	CardNode,
	ColumnboardBoardElement,
	ColumnBoardNode,
	ColumnBoardTarget,
	ColumnNode,
	ClassEntity,
	FileElementNode,
	LinkElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
	ExternalToolElementNodeEntity,
	Course,
	ContextExternalToolEntity,
	CourseGroup,
	CourseNews,
	DashboardGridElementModel,
	DashboardModelEntity,
	ExternalToolEntity,
	FederalStateEntity,
	ImportUser,
	LessonEntity,
	LessonBoardElement,
	LtiTool,
	Material,
	News,
	PseudonymEntity,
	ExternalToolPseudonymEntity,
	Role,
	SchoolEntity,
	SchoolExternalToolEntity,
	SchoolNews,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYearEntity,
	ShareToken,
	StorageProviderEntity,
	Submission,
	SystemEntity,
	Task,
	TaskBoardElement,
	TeamEntity,
	TeamNews,
	TeamUserEntity,
	User,
	UserLoginMigrationEntity,
	VideoConference,
	GroupEntity,
	RegistrationPinEntity,
];

const setupNestServices = async (app) => {
	const module = await Test.createTestingModule({
		imports: [
			MikroOrmModule.forRoot({
				type: 'mongo',
				clientUrl: DB_URL,
				password: DB_PASSWORD,
				user: DB_USERNAME,
				entities,
				allowGlobalContext: true,
				// debug: true, // use it for locally debugging of querys
			}),
			ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			AccountApiModule,
			TeamsApiModule,
			AuthorizationModule,
		],
	}).compile();
	const nestApp = await module.createNestApplication().init();
	const orm = nestApp.get(MikroORM);
	const accountUc = nestApp.get(AccountUc);
	const accountService = nestApp.get(AccountService);
	const accountValidationService = nestApp.get(AccountValidationService);
	const teamService = nestApp.get(TeamService);
	const systemRule = nestApp.get(SystemRule);

	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;
	app.services['nest-account-validation-service'] = accountValidationService;
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
