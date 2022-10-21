import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing/index';
import { ExternalTool } from '@shared/domain/index';
import { externalToolFactory } from '@shared/testing/factory/external-tool.factory';

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
			const test = () => new ExternalTool();
			expect(test).toThrow();
		});

		it('should create an external Tool with basic configuration by passing required properties', () => {
			const basicExternalTool: ExternalTool = externalToolFactory.withBasicConfig().buildWithId();
			expect(basicExternalTool instanceof ExternalTool).toEqual(true);
		});

		it('should create an external Tool with oauth2 configuration by passing required properties', () => {
			const oauth2ExternalTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
			expect(oauth2ExternalTool instanceof ExternalTool).toEqual(true);
		});

		it('should create an external Tool with LTI 1.1 configuration by passing required properties', () => {
			const lti11ExternalTool: ExternalTool = externalToolFactory.withLti11Config().buildWithId();
			expect(lti11ExternalTool instanceof ExternalTool).toEqual(true);
		});
	});
});
