import { type ModulesContainer } from '@nestjs/core';

export interface LogOrigin {
	context: string;
	module?: string;
}

const moduleNamesByContainer = new WeakMap<ModulesContainer, Map<unknown, string>>();

// There is no inquirer when a logger is injected into a factory (null) or resolved directly (Nest then reports
// the logger itself, see isLogger).
const getInquirerClass = (
	inquirer: object | null | undefined,
	isLogger: (inquirer: object) => boolean
): { name: string } | undefined => {
	if (inquirer === null || inquirer === undefined || isLogger(inquirer)) {
		return undefined;
	}

	return (inquirer as { constructor?: { name: string } }).constructor;
};

// Built once per application. A class provided by several modules gets the first one.
const getModuleNames = (modulesContainer: ModulesContainer): Map<unknown, string> => {
	let moduleNames = moduleNamesByContainer.get(modulesContainer);

	if (!moduleNames) {
		moduleNames = new Map();
		for (const module of modulesContainer.values()) {
			for (const wrapper of [...module.providers.values(), ...module.controllers.values()]) {
				if (wrapper.metatype && !moduleNames.has(wrapper.metatype)) {
					moduleNames.set(wrapper.metatype, module.metatype.name);
				}
			}
		}
		moduleNamesByContainer.set(modulesContainer, moduleNames);
	}

	return moduleNames;
};

/**
 * The class a transient logger is injected into (Nest's INQUIRER) and the Nest module providing that class.
 */
export const getLogOrigin = (
	inquirer: object | null | undefined,
	modulesContainer: ModulesContainer | undefined,
	isLogger: (inquirer: object) => boolean
): LogOrigin => {
	const inquirerClass = getInquirerClass(inquirer, isLogger);
	const context = inquirerClass && inquirerClass.name !== 'Object' ? inquirerClass.name : '';
	const module = inquirerClass && modulesContainer ? getModuleNames(modulesContainer).get(inquirerClass) : undefined;

	return { context, module };
};
