import { Application as FeathersApplication } from '@feathersjs/feathers';
import { deleteUserData } from './pseudonym.uc';

const facade = {
	deleteUserData,
};

export default (app: FeathersApplication): void => {
	app.registerFacade('/pseudonym/v2', facade);
};
