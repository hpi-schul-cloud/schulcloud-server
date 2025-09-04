const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
	module: {
		rules: [
			{
				test: /apps\/server\/.*\.ts$/,
				exclude: /node_modules/,
				use: {
					loader: 'swc-loader',
					options: swcDefaultConfig,
				},
			},
		],
	},
};
