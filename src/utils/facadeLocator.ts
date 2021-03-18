import { Application as FeathersApplication } from '@feathersjs/feathers';

function stripSlashes(path: string): string {
	return path.replace(/^(\/+)|(\/+)$/g, '');
}

// TODO add keyof operator to know all service identifiers with their types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const facadeDict: Record<string, any> = {};

const facadeLocator = {
	facade: <T>(path: string): T => {
		const strippedPath = stripSlashes(path);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (facadeDict[strippedPath] as any) as T;
	},
	registerFacade: <T>(path: string, facade: T): void => {
		const strippedPath = stripSlashes(path);
		facadeDict[strippedPath] = facade;
	},
};

const setupFacadeLocator = (app: FeathersApplication): FeathersApplication => {
	app.registerFacade = (path, facade) => facadeLocator.registerFacade(path, facade);
	app.facade = <T>(path: string) => facadeLocator.facade<T>(path);
	return app;
};

export { setupFacadeLocator, facadeLocator };
