import { Helpers, Components } from '../../core';

let modules = {};

export default {

	SetupModules: (modules) => {
		Object.values(modules).forEach((module, key) => {
			Helpers.Module.SetupModule(module, key);
		});
	},

	SetupModule: (module, key) => {
		modules[key] = module;

		(module.Routes || []).forEach((route) => {
			Helpers.Router.AddRoute(route.name, {
				path: route.path,
				name: route.name,
				component: route.component
			});
		});
	},

	GetModule: (key) => {
		return modules[key];
	}

}
