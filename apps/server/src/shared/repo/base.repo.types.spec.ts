import path from 'node:path';
import ts from 'typescript';

describe('MikroORM entity data type contracts', () => {
	const cases = [
		{ statement: "repo.create({ name: 'valid' });", valid: true },
		{ statement: "repo.create({ name: 'valid', description: 'optional' });", valid: true },
		{ statement: 'repo.create(entity);', valid: true },
		{ statement: "repo.create({ name: 'invalid', unknownProperty: true });", valid: false },
		{ statement: 'repo.create({});', valid: false },
		{ statement: 'repo.create({ name: 123 });', valid: false },
		{ statement: "repo.create({ name: 'invalid', description: 123 });", valid: false },
		{ statement: 'repo.create(extraProperties);', valid: false },
		{ statement: "em.create(TypeContractEntity, { name: 'valid' });", valid: true },
		{ statement: "em.create(TypeContractEntity, { name: 'valid', description: 'optional' });", valid: true },
		{ statement: "em.create(TypeContractEntity, { name: 'invalid', unknownProperty: true });", valid: false },
		{ statement: 'em.create(TypeContractEntity, {});', valid: false },
		{ statement: 'em.create(TypeContractEntity, { name: 123 });', valid: false },
		{ statement: "em.assign(entity, { description: 'updated' });", valid: true },
		{ statement: 'em.assign(entity, { unknownProperty: true });', valid: false },
		{ statement: 'em.assign(entity, { name: 123 });', valid: false },
	];
	let diagnosticsByLine: Map<number, ts.Diagnostic[]>;
	let firstCaseLine: number;

	beforeAll(() => {
		const configPath = ts.findConfigFile(process.cwd(), (file) => ts.sys.fileExists(file), 'tsconfig.json');
		if (!configPath) {
			throw new Error('Project tsconfig.json not found');
		}
		const config = ts.readConfigFile(configPath, (file) => ts.sys.readFile(file));
		if (config.error) {
			throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
		}
		const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
		expect(parsed.errors).toEqual([]);
		const fileName = path.join(__dirname, '__entity-data-type-contract.ts');
		const header = [
			"import { type EntityName } from '@mikro-orm/core';",
			"import { type EntityManager } from '@mikro-orm/mongodb';",
			"import { BaseEntity } from '../domain/entity/base.entity';",
			"import { BaseRepo } from './base.repo';",
			'class TypeContractEntity extends BaseEntity { name!: string; description?: string; }',
			'class TypeContractRepo extends BaseRepo<TypeContractEntity> {',
			'get entityName(): EntityName<TypeContractEntity> { return TypeContractEntity; }',
			'}',
			'declare const repo: TypeContractRepo;',
			'declare const em: EntityManager;',
			'declare const entity: TypeContractEntity;',
			"const extraProperties = { name: 'invalid', unknownProperty: true };",
		];
		firstCaseLine = header.length;
		const source = [...header, ...cases.map(({ statement }) => statement)].join('\n');
		const options: ts.CompilerOptions = { ...parsed.options, noEmit: true, incremental: false };
		const host = ts.createCompilerHost(options);
		const getSourceFile = host.getSourceFile.bind(host);
		host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
			name === fileName
				? ts.createSourceFile(name, source, languageVersion, true)
				: getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
		const program = ts.createProgram([fileName], options, host);
		diagnosticsByLine = new Map();
		for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
			if (diagnostic.file?.fileName !== fileName || diagnostic.start === undefined) {
				throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
			}
			const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
			expect(line).toBeGreaterThanOrEqual(firstCaseLine);
			const diagnostics = diagnosticsByLine.get(line) ?? [];
			diagnostics.push(diagnostic);
			diagnosticsByLine.set(line, diagnostics);
		}
	}, 30000);

	it.each(
		cases.map((testCase, index) => {
			return { ...testCase, index };
		})
	)('accepts=$valid: $statement', ({ index, valid }) => {
		const diagnostics = diagnosticsByLine.get(firstCaseLine + index) ?? [];
		if (valid) {
			expect(diagnostics).toEqual([]);
		} else {
			expect(diagnostics.length).toBeGreaterThan(0);
			expect(diagnostics.every(({ category }) => category === ts.DiagnosticCategory.Error)).toBe(true);
		}
	});
});
