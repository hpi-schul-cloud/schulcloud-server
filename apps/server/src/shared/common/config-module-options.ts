import { ConfigModuleOptions } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createConfigModuleOptions = (config: () => Record<string, any>): ConfigModuleOptions => {
	const options = {
		isGlobal: true,
		validationOptions: { infer: true },

		// hacky solution: the config is loaded in the validate step.
		// reasoning: nest's ConfigService has fixed priority of configs.
		// 1. validated configs, 2. default passed in configService.get(key, default) 3. process.env 4. custom configs
		// in process env everything is a string. So a feature flag will be the string 'false' and therefore truthy
		// So we want custom configs to overwrite process.env. Thus we make them validated
		validate: config,
	};

	return options;
};
