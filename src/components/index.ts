import { Application as FeathersApplication } from '@feathersjs/feathers';

import userComponent from './user';
import fileStorageComponent from './fileStorage';
import helpdeskComponent from './helpdesk';
import pseudonymComponent from './pseudonym';
import courseComponent from './course';
import userGroupComponent from './user-group';
import schoolComponent from './school';

export default (app: FeathersApplication): void => {
	app.configure(userComponent);
	app.configure(fileStorageComponent);
	app.configure(helpdeskComponent);
	app.configure(pseudonymComponent);
	app.configure(courseComponent);
	app.configure(schoolComponent);
	app.configure(userGroupComponent);
};
