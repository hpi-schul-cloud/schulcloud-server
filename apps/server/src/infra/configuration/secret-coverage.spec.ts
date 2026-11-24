import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Guard against new config properties with a secret-like name that are not marked with @Secret().
 * Without the mark, the logger does not mask their values.
 * Not covered here: secrets from the database and user-supplied secrets (they are not config properties),
 * and secrets inside other values such as URLs with credentials.
 */

// Names that look secret but are not. Every entry needs a reason.
const NOT_SECRET: Record<string, string> = {
	JWT_PUBLIC_KEY: 'public key',
	MAIL_SEND_ROUTING_KEY: 'RabbitMQ routing key',
	FWU_CONTENT__S3_ACCESS_KEY: 'S3 access key id; the secret part is FWU_CONTENT__S3_SECRET_KEY',
	CTL_SEED_BILO_LTI_KEY: 'LTI consumer key (public id); the secret part is CTL_SEED_BILO_LTI_SECRET',
};

const SECRET_WORDS = new Set(['SECRET', 'PASSWORD', 'PASSWD', 'CREDENTIAL', 'CREDENTIALS', 'SALT']);
// Only as last word, so TOKEN_ENDPOINT or TOKEN_LIFETIME_MS don't count.
const SECRET_LAST_WORDS = new Set(['TOKEN', 'KEY', 'KEYS']);

const toWords = (name: string): string[] =>
	name
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.toUpperCase()
		.split(/[^A-Z\d]+/)
		.filter(Boolean);

const looksSecret = (name: string): boolean => {
	const words = toWords(name);

	return words.some((word) => SECRET_WORDS.has(word)) || SECRET_LAST_WORDS.has(words[words.length - 1]);
};

interface ConfigPropertyInfo {
	file: string;
	name: string;
	hasSecret: boolean;
}

const getDecoratorName = (decorator: ts.Decorator): string | undefined =>
	ts.isCallExpression(decorator.expression) ? decorator.expression.expression.getText() : undefined;

// The env variable name: the argument of @ConfigProperty('NAME'), else the property name.
const getConfigName = (configProperty: ts.Decorator, property: ts.PropertyDeclaration): string => {
	const [arg] = ts.isCallExpression(configProperty.expression) ? configProperty.expression.arguments : [];

	return arg && ts.isStringLiteral(arg) ? arg.text : property.name.getText();
};

const collectConfigProperties = (file: string): ConfigPropertyInfo[] => {
	const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
	const result: ConfigPropertyInfo[] = [];

	const visit = (node: ts.Node): void => {
		if (ts.isPropertyDeclaration(node)) {
			const decorators = ts.getDecorators(node) ?? [];
			const configProperty = decorators.find((decorator) => getDecoratorName(decorator) === 'ConfigProperty');
			if (configProperty) {
				result.push({
					file,
					name: getConfigName(configProperty, node),
					hasSecret: decorators.some((decorator) => getDecoratorName(decorator) === 'Secret'),
				});
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);

	return result;
};

// Test configs hold fixture values, not real secrets.
const isProductionSourceFile = (file: string): boolean =>
	file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.split(path.sep).includes('testing');

describe('config properties with a secret-like name', () => {
	const srcDir = path.resolve(__dirname, '../..');
	const configProperties = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
		.map((relativePath) => path.join(srcDir, relativePath))
		.filter(isProductionSourceFile)
		.filter((file) => readFileSync(file, 'utf8').includes('@ConfigProperty('))
		.flatMap(collectConfigProperties);

	it('should find config properties (guards the guard)', () => {
		expect(configProperties.filter((property) => property.hasSecret).length).toBeGreaterThan(20);
	});

	it('should all be marked with @Secret()', () => {
		const unmarked = configProperties
			.filter((property) => looksSecret(property.name) && !(property.name in NOT_SECRET) && !property.hasSecret)
			.map((property) => `${property.name} (${path.relative(srcDir, property.file)})`);

		// If this fails: add @Secret() to the property, or add its name to NOT_SECRET with a reason.
		expect(unmarked).toEqual([]);
	});

	it('should not list names in NOT_SECRET that are no longer config properties', () => {
		const names = new Set(configProperties.map((property) => property.name));

		expect(Object.keys(NOT_SECRET).filter((name) => !names.has(name))).toEqual([]);
	});
});
