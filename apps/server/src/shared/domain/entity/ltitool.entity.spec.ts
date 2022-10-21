import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { LtiPrivacyPermission, LtiTool } from '@shared/domain';
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

		it('should create a ltiTool with defaults for undefined properties', () => {
			const ltiTool: LtiTool = ltiToolFactory.withName('someTool').buildWithId({
				privacy_permission: undefined,
				customs: undefined,
				roles: undefined,
				openNewTab: undefined,
			});

			expect(ltiTool).toEqual(
				expect.objectContaining({
					privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					customs: [],
					roles: [],
					openNewTab: false,
				})
			);
		});
	});

	describe('originToolId', () => {
		it('should return the originToolId', () => {
			const ltiTool: LtiTool = ltiToolFactory.withName('someTool').buildWithId();

			expect(ltiTool.originToolId).toEqual(ltiTool._originToolId?.toHexString());
		});

		it('should return undefined', () => {
			const ltiTool: LtiTool = ltiToolFactory.withName('someTool').buildWithId();
			ltiTool._originToolId = undefined;

			expect(ltiTool.originToolId).toBeUndefined();
		});
	});
});
