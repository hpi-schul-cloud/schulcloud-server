import { MikroORM } from '@mikro-orm/core';
import { ConfigurationFactory } from '@infra/configuration/configuration.factory';
import { Entity, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { type MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { BaseEntity } from '@shared/domain/entity';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig } from './database.config';
import { DatabaseModule } from './database.module';

@Entity()
class ConfigurationTestEntity extends BaseEntity {
	@Property()
	name!: string;
}

describe(DatabaseModule.name, () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([false, true])(
		'should prefer application configuration over ORM environment values when flags are %s',
		async (enabled) => {
			// eslint-disable-next-line no-process-env
			const mongoUri = process.env.MONGO_TEST_URI;
			if (!mongoUri) {
				throw new Error('MONGO_TEST_URI is required');
			}
			const dbName = `config-${new ObjectId().toHexString()}`;
			const dbUrl = `${mongoUri}/${dbName}`;
			const migrationOptions = {
				tableName: 'application-migrations',
				transactional: enabled,
				allOrNothing: enabled,
			};
			jest.replaceProperty(process, 'env', {
				// eslint-disable-next-line no-process-env
				...process.env,
				DB_URL: dbUrl,
				DB_USERNAME: '',
				DB_PASSWORD: '',
				DB_ENSURE_INDEXES: String(enabled),
				DB_ALLOW_GLOBAL_CONTEXT: String(enabled),
				DB_DEBUG: 'false',
				MIKRO_ORM_CLIENT_URL: `${mongoUri}/ignored-orm-config`,
				MIKRO_ORM_USER: 'ignored-orm-user',
				MIKRO_ORM_PASSWORD: 'ignored-orm-password',
				MIKRO_ORM_ENSURE_INDEXES: String(!enabled),
				MIKRO_ORM_ALLOW_GLOBAL_CONTEXT: String(!enabled),
				MIKRO_ORM_DEBUG: 'true',
				MIKRO_ORM_MIGRATIONS_TABLE_NAME: 'ignored-orm-migrations',
				MIKRO_ORM_MIGRATIONS_TRANSACTIONAL: String(!enabled),
				MIKRO_ORM_MIGRATIONS_ALL_OR_NOTHING: String(!enabled),
			});
			const configurationSpy = jest.spyOn(ConfigurationFactory.prototype, 'loadAndValidateConfigs');
			const initSpy = jest.spyOn(MikroORM, 'init');

			const module = await Test.createTestingModule({
				imports: [
					DatabaseModule.register({
						configInjectionToken: DATABASE_CONFIG_TOKEN,
						configConstructor: DatabaseConfig,
						entities: [ConfigurationTestEntity],
						migrationOptions,
					}),
				],
			}).compile();

			try {
				const config = module.get<DatabaseConfig>(DATABASE_CONFIG_TOKEN);
				const orm = module.get<MikroORM<MongoDriver>>(MikroORM);

				expect(config.dbUrl).toBe(dbUrl);
				expect(config.dbEnsureIndexes).toBe(enabled);
				expect(config.dbAllowGlobalContext).toBe(enabled);
				expect(configurationSpy).toHaveBeenCalledWith(DatabaseConfig);
				expect(initSpy).toHaveBeenCalledTimes(1);
				expect(configurationSpy.mock.invocationCallOrder[0]).toBeLessThan(initSpy.mock.invocationCallOrder[0]);
				expect(orm.config.get('clientUrl')).toBe(dbUrl);
				expect(orm.config.get('user')).toBe('');
				expect(orm.config.get('password')).toBe('');
				expect(orm.config.get('ensureIndexes')).toBe(enabled);
				expect(orm.config.get('allowGlobalContext')).toBe(enabled);
				expect(orm.config.get('debug')).toBe(false);
				expect(orm.config.get('metadataProvider')).toBe(ReflectMetadataProvider);
				expect(orm.config.get('migrations')).toMatchObject(migrationOptions);
				expect(Reflect.getMetadata('design:type', ConfigurationTestEntity.prototype, 'name')).toBe(String);
				expect(orm.getMetadata().get(ConfigurationTestEntity).properties.name.type).toBe('string');

				const em = orm.em.fork();
				const entity = em.create(ConfigurationTestEntity, { name: 'configuration precedence' });
				await em.persist(entity).flush();
				em.clear();

				expect((await em.findOneOrFail(ConfigurationTestEntity, entity.id)).name).toBe('configuration precedence');
				const db = em.getConnection().getDb();
				expect(db.databaseName).toBe(dbName);
				expect(
					await db.collection(orm.getMetadata().get(ConfigurationTestEntity).collection).findOne({
						_id: entity._id,
					})
				).toMatchObject({ name: 'configuration precedence' });
			} finally {
				await module.close();
			}
		}
	);

	it('should load dotenv database values while preferring deployment values over file values', async () => {
		// eslint-disable-next-line no-process-env
		const mongoUri = process.env.MONGO_TEST_URI;
		if (!mongoUri) {
			throw new Error('MONGO_TEST_URI is required');
		}
		const dbName = `dotenv-${new ObjectId().toHexString()}`;
		const directory = await mkdtemp(join(tmpdir(), 'database-config-'));
		const envFile = join(directory, '.env');
		const forRoot = ConfigModule.forRoot.bind(ConfigModule);
		jest.spyOn(ConfigModule, 'forRoot').mockImplementation((options) => forRoot({ ...options, envFilePath: envFile }));
		// eslint-disable-next-line no-process-env
		const env = { ...process.env };
		for (const key of ['DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'DB_ENSURE_INDEXES', 'DB_ALLOW_GLOBAL_CONTEXT']) {
			delete env[key];
		}
		jest.replaceProperty(process, 'env', {
			...env,
			DB_DEBUG: 'false',
			MIKRO_ORM_CLIENT_URL: `${mongoUri}/ignored-dotenv-config`,
			MIKRO_ORM_DEBUG: 'true',
		});

		try {
			await writeFile(
				envFile,
				[
					`DB_URL=\${MONGO_TEST_URI}/${dbName}`,
					'DB_USERNAME=',
					'DB_PASSWORD=',
					'DB_ENSURE_INDEXES=false',
					'DB_ALLOW_GLOBAL_CONTEXT=true',
					'DB_DEBUG=true',
				].join('\n')
			);
			const module = await Test.createTestingModule({
				imports: [
					DatabaseModule.register({
						configInjectionToken: DATABASE_CONFIG_TOKEN,
						configConstructor: DatabaseConfig,
						entities: [ConfigurationTestEntity],
					}),
				],
			}).compile();

			try {
				const config = module.get<DatabaseConfig>(DATABASE_CONFIG_TOKEN);
				const orm = module.get<MikroORM<MongoDriver>>(MikroORM);
				expect(config.dbUrl).toBe(`${mongoUri}/${dbName}`);
				expect(config.dbDebug).toBe(false);
				expect(orm.config.get('clientUrl')).toBe(config.dbUrl);
				expect(orm.config.get('debug')).toBe(false);
				const em = orm.em.fork();
				await em.persist(em.create(ConfigurationTestEntity, { name: 'dotenv configuration' })).flush();
				expect(em.getConnection().getDb().databaseName).toBe(dbName);
			} finally {
				await module.close();
			}
		} finally {
			await rm(directory, { recursive: true });
		}
	});

	it('should reject invalid application configuration before initializing the ORM', async () => {
		jest.replaceProperty(process, 'env', {
			// eslint-disable-next-line no-process-env
			...process.env,
			DB_URL: 'not a valid URL',
		});
		const initSpy = jest.spyOn(MikroORM, 'init');

		await expect(
			Test.createTestingModule({
				imports: [
					DatabaseModule.register({
						configInjectionToken: DATABASE_CONFIG_TOKEN,
						configConstructor: DatabaseConfig,
						entities: [ConfigurationTestEntity],
					}),
				],
			}).compile()
		).rejects.toThrow('dbUrl');
		expect(initSpy).not.toHaveBeenCalled();
	});
});
