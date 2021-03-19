import { Application as FeathersApplication } from '@feathersjs/feathers';
import { static as staticContent } from '@feathersjs/express';
import path from 'path';

import service from 'feathers-mongoose';
import { PseudonymModel } from '../../components/pseudonym/repo/db/pseudonym';
import hooks from './hooks';

export default (app: FeathersApplication): void => {
	const options = {
		Model: PseudonymModel,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: false,
	};
	app.use('/pseudonym/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/pseudonym', service(options));

	const pseudonymService = app.service('/pseudonym');
	pseudonymService.hooks(hooks);
};
