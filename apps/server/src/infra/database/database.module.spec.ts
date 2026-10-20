import { MikroORM } from '@mikro-orm/core';
import { ConfigurationFactory } from '@infra/configuration/configuration.factory';
import { Entity, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { type MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { BaseEntity } from '@shared/domain/entity';
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
			const dbUrl = `${mongoUri}/config-${new ObjectId().toHexString()}`;
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
				MIKRO_ORM_ENSURE_INDEXES: String(!enabled),
				MIKRO_ORM_ALLOW_GLOBAL_CONTEXT: String(!enabled),
				MIKRO_ORM_DEBUG: 'true',
			});
			const configurationSpy = jest.spyOn(ConfigurationFactory.prototype, 'loadAndValidateConfigs');
			const initSpy = jest.spyOn(MikroORM, 'init');

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

				expect(config.dbUrl).toBe(dbUrl);
				expect(config.dbEnsureIndexes).toBe(enabled);
				expect(config.dbAllowGlobalContext).toBe(enabled);
				expect(configurationSpy).toHaveBeenCalledWith(DatabaseConfig);
				expect(initSpy).toHaveBeenCalledTimes(1);
				expect(configurationSpy.mock.invocationCallOrder[0]).toBeLessThan(initSpy.mock.invocationCallOrder[0]);
				expect(orm.config.get('clientUrl')).toBe(dbUrl);
				expect(orm.config.get('ensureIndexes')).toBe(enabled);
				expect(orm.config.get('allowGlobalContext')).toBe(enabled);
				expect(orm.config.get('debug')).toBe(false);
				expect(orm.config.get('metadataProvider')).toBe(ReflectMetadataProvider);
				expect(Reflect.getMetadata('design:type', ConfigurationTestEntity.prototype, 'name')).toBe(String);
				expect(orm.getMetadata().get(ConfigurationTestEntity).properties.name.type).toBe('string');

				const em = orm.em.fork();
				const entity = em.create(ConfigurationTestEntity, { name: 'configuration precedence' });
				await em.persist(entity).flush();
				em.clear();

				expect((await em.findOneOrFail(ConfigurationTestEntity, entity.id)).name).toBe('configuration precedence');
			} finally {
				await module.close();
			}
		}
	);

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
