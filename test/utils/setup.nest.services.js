const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');
const { MikroOrmModule } = require('@mikro-orm/nestjs');

// run 'npm run nest:build' for the following imports to work,
// this is a workaround to make TypeScript modules available in JavaScript
const { AccountModule } = require('../../dist/apps/server/modules/account/account.module');
const { AccountUc } = require('../../dist/apps/server/modules/account/uc/account.uc');
const { AccountService } = require('../../dist/apps/server/modules/account/services/account.service');
const { DB_PASSWORD, DB_URL, DB_USERNAME } = require('../../dist/apps/server/config/database.config');
const { ALL_ENTITIES } = require('../../dist/apps/server/shared/domain/entity/all-entities');

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
			AccountModule,
		],
	}).compile();
	const nestApp = await module.createNestApplication().init();
	const orm = nestApp.get(MikroORM);
	const accountUc = nestApp.get(AccountUc);
	const accountService = nestApp.get(AccountService);

	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;

	return { nestApp, orm, accountUc, accountService };
};

const closeNestServices = async (nestServices) => {
	await nestServices.nestApp.close();
	await nestServices.orm.close();
};

module.exports = {
	setupNestServices,
	closeNestServices,
};
