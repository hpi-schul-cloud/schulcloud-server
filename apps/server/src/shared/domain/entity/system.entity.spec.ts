import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { System } from './system.entity';

describe('System Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new System();
			expect(test).toThrow();
		});

		it('should create a system by passing required properties', () => {
			const system = systemFactory.build();
			expect(system instanceof System).toEqual(true);
		});
		it('should create a system by passing required and optional properties', () => {
			const system = systemFactory.build({ url: 'SAMPLE_URL', alias: 'SAMPLE_ALIAS', displayName: 'SAMPLE_NAME' });
			expect(system instanceof System).toEqual(true);
			expect(system.url).toEqual('SAMPLE_URL');
			expect(system.alias).toEqual('SAMPLE_ALIAS');
			expect(system.displayName).toEqual('SAMPLE_NAME');
		});
	});
});
