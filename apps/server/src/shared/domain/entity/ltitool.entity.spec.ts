import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing/index';
import { LtiTool } from '@shared/domain/index';
import { ltiToolFactory } from '@shared/testing/factory/ltitool.factory';

describe('Ltitool Entity', () => {
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
			const test = () => new LtiTool();
			expect(test).toThrow();
		});

		it('should create a ltiTool by passing required properties', () => {
			const ltiTool: LtiTool = ltiToolFactory.withName('someTool').buildWithId();
			expect(ltiTool instanceof LtiTool).toEqual(true);
		});
	});
});
