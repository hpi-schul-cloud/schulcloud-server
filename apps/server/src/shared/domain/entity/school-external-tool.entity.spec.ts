import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing/index';
import { SchoolExternalTool } from '@shared/domain';
import { schoolExternalToolFactory } from '@shared/testing/factory/school-external-tool.factory';

describe('ExternalTool Entity', () => {
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
			const test = () => new SchoolExternalTool();
			expect(test).toThrow();
		});

		it('should create an external school Tool by passing required properties', () => {
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			expect(schoolExternalTool instanceof SchoolExternalTool).toEqual(true);
		});
	});
});
