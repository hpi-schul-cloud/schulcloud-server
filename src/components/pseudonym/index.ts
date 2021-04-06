import { Application as FeathersApplication } from '@feathersjs/feathers';
import pseudonymFacade from './uc/pseudonym.facade';

export default (app: FeathersApplication): void => {
	app.configure(pseudonymFacade);
};
