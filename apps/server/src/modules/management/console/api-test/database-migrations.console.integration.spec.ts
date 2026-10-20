import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ConsoleWriterService } from '@infra/console';
import { MikroORM } from '@mikro-orm/core';
import { Migration } from '@mikro-orm/migrations-mongodb';
import { type MongoDriver } from '@mikro-orm/mongodb';
import { type INestApplicationContext } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AbstractBootstrapConsole, ConsoleService } from 'nestjs-console';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ManagementConsoleTestModule } from '../../management-console.app.module';
import migrationOptions from '../../migrations-options';
import { DatabaseManagementUc } from '../../uc/database-management.uc';
import { execute } from './test-bootstrap.console';

class ConsoleLifecycleMigration extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('console-migration-probe').insertOne({ marker: 'up' });
	}

	public async down(): Promise<void> {
		await this.getCollection('console-migration-probe').deleteMany({ marker: 'up' });
	}
}

class MigrationBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	public create(): Promise<TestingModule> {
		return Test.createTestingModule({ imports: [this.options.module] })
			.overrideProvider(ConsoleWriterService)
			.useValue(createMock<ConsoleWriterService>())
			.compile();
	}
}

describe('database migration console with real migrator', () => {
	let bootstrap: MigrationBootstrapConsole;
	let app: INestApplicationContext;
	let orm: MikroORM<MongoDriver>;
	let writer: DeepMocked<ConsoleWriterService>;
	let directory: string;

	beforeAll(async () => {
		directory = await mkdtemp(path.join(tmpdir(), 'console-migration-'));
		bootstrap = new MigrationBootstrapConsole({ module: ManagementConsoleTestModule, useDecorators: true });
		app = await bootstrap.init();
		orm = app.get(MikroORM);
		orm.config.set('migrations', {
			...orm.config.get('migrations'),
			...migrationOptions,
			path: directory,
			pathTs: directory,
			migrationsList: [{ name: 'Migration20990101000000', class: ConsoleLifecycleMigration }],
		});
		await app.init();
		app.get(ConsoleService).getRootCli().exitOverride();
		app.get(ConsoleService).getCli('database')?.exitOverride();
		writer = app.get(ConsoleWriterService);
	});

	afterAll(async () => {
		try {
			app.get(ConsoleService).resetCli();
			await app.close();
		} finally {
			await rm(directory, { recursive: true });
		}
	});

	it('should list, execute and roll back an isolated migration via parsed console arguments', async () => {
		await execute(bootstrap, ['database', 'migration', '--pending']);
		expect(writer.info).toHaveBeenLastCalledWith('Pending: ["Migration20990101000000"]');

		await execute(bootstrap, ['database', 'migration', '--up']);
		expect(writer.info).toHaveBeenLastCalledWith('migration up is completed');
		expect(await orm.em.getCollection('console-migration-probe').countDocuments({ marker: 'up' })).toBe(1);
		expect((await orm.migrator.getExecuted()).map((migration) => migration.name)).toEqual(['Migration20990101000000']);

		await execute(bootstrap, ['database', 'migration', '--pending']);
		expect(writer.info).toHaveBeenLastCalledWith('Pending: []');

		await execute(bootstrap, ['database', 'migration', '--down']);
		expect(writer.info).toHaveBeenLastCalledWith('migration down is completed');
		expect(await orm.em.getCollection('console-migration-probe').countDocuments()).toBe(0);
		expect(await orm.migrator.getExecuted()).toEqual([]);
	});

	it('should accept a migration name for the only option', async () => {
		await execute(bootstrap, ['database', 'migration', '--up', '--only', 'Migration20990101000000']);
		expect((await orm.migrator.getExecuted()).map((migration) => migration.name)).toEqual(['Migration20990101000000']);
		await execute(bootstrap, ['database', 'migration', '--down', '--only', 'Migration20990101000000']);
		expect(await orm.migrator.getExecuted()).toEqual([]);
	});

	it('should forward migration range names as strings', async () => {
		const up = jest.spyOn(app.get(DatabaseManagementUc), 'migrationUp').mockResolvedValueOnce();
		try {
			await execute(bootstrap, [
				'database',
				'migration',
				'--up',
				'--from',
				'Migration20980101000000',
				'--to',
				'Migration20990101000000',
			]);
			expect(up).toHaveBeenCalledWith('Migration20980101000000', 'Migration20990101000000', undefined);
		} finally {
			up.mockRestore();
		}
	});

	it('should generate a TypeScript migration only in the isolated temporary directory', async () => {
		await execute(bootstrap, ['database', 'migration', '--create']);
		expect(writer.info).toHaveBeenLastCalledWith('migration created');
		const files = (await readdir(directory)).filter((name) => /^Migration.*\.ts$/.test(name));
		expect(files).toHaveLength(1);
		const generated = await readFile(path.join(directory, files[0]), 'utf8');
		expect(generated).toContain("from '@mikro-orm/migrations-mongodb'");
		expect(generated).toContain('extends Migration');
		expect(await orm.migrator.getExecuted()).toEqual([]);
	});
});
