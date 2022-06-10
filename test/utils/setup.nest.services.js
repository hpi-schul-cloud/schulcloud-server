const { MikroORM } = require('@mikro-orm/core');
const { Test } = require('@nestjs/testing');

// run 'npm run nest:build' for the following imports to work,
// this is a workaround to make TypeScript modules available in JavaScript
const { ServerFeathersTestModule } = require('../../dist/apps/server/server.module');
const { AccountModule } = require('../../dist/apps/server/modules/account/account.module');
const { AccountUc } = require('../../dist/apps/server/modules/account/uc/account.uc');
const { AccountService } = require('../../dist/apps/server/modules/account/services/account.service');

const setupNestServices = async (app) => {
	const module = await Test.createTestingModule({
		imports: [ServerFeathersTestModule, AccountModule],
	}).compile();
	const nestApp = await module.createNestApplication().init();
	const orm = nestApp.get(MikroORM);
	const accountUc = nestApp.get(AccountUc);
	const accountService = nestApp.get(AccountService);

	app.services['nest-account-uc'] = accountUc;
	app.services['nest-account-service'] = accountService;

	return { nestApp, orm, accountUc, accountService };
};

module.exports = {
	setupNestServices,
};
