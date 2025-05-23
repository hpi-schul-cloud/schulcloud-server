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
const { TeamService } = require('../../dist/apps/server/modules/team/domain/service/team.service');
const { TeamApiModule } = require('../../dist/apps/server/modules/team/team-api.module');
const { AuthorizationModule } = require('../../dist/apps/server/modules/authorization');
const { SystemRule, AuthorizationRulesModule } = require('../../dist/apps/server/modules/authorization-rules');
const { createConfigModuleOptions } = require('../../dist/apps/server/shared/common/config-module-options');
const { serverConfig } = require('../../dist/apps/server/modules/server/server.config');
const { TEST_ENTITIES } = require('../../dist/apps/server/modules/server/server.entity.imports');
const { RosterModule } = require('../../dist/apps/server/modules/roster/roster.module');
const { FeathersRosterService } = require('../../dist/apps/server/modules/roster/service/feathers-roster.service');
const { RabbitMQWrapperTestModule } = require('../../dist/apps/server/infra/rabbitmq/rabbitmq.module');

const setupNestServices = async (app) => {
	const module = await Test.createTestingModule({
		imports: [
			RabbitMQWrapperTestModule,
			MikroOrmModule.forRoot(
				defineConfig({
					type: 'mongo',
					clientUrl: DB_URL,
					password: DB_PASSWORD,
					user: DB_USERNAME,
					entities: TEST_ENTITIES,
					allowGlobalContext: true,
					// debug: true, // use it for locally debugging of querys
				})
			),
			ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
			AccountApiModule,
			TeamApiModule,
			AuthorizationModule,
			AuthorizationRulesModule,
			RosterModule,
		],
	}).compile();
	const nestApp = await module.createNestApplication().init();
	const orm = nestApp.get(MikroORM);
	const accountUc = nestApp.get(AccountUc);
	const accountService = nestApp.get(AccountService);
	const teamService = nestApp.get(TeamService);
	const systemRule = nestApp.get(SystemRule);
	const feathersRosterService = nestApp.get(FeathersRosterService);

	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;
	app.services['nest-team-service'] = teamService;
	app.services['nest-system-rule'] = systemRule;
	app.services['nest-feathers-roster-service'] = feathersRosterService;
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
