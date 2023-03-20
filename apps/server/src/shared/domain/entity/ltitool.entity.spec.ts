import { LtiPrivacyPermission, LtiTool } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { ltiToolFactory } from '@shared/testing/factory/ltitool.factory';

describe('Ltitool Entity', () => {
	beforeAll(async () => {
		await setupEntities();
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
			const ltiTool: LtiTool = ltiToolFactory
				.withName('someTool')
				.buildWithId({ privacy_permission: undefined, customs: undefined });

			expect(ltiTool).toEqual(
				expect.objectContaining({
					privacy_permission: LtiPrivacyPermission.ANONYMOUS,
					customs: [],
				})
			);
		});
	});

	describe('originToolId', () => {
		it('should return the originToolId', () => {
			const ltiTool: LtiTool = ltiToolFactory.withName('someTool').buildWithId();

			expect(ltiTool.originToolId).toEqual(ltiTool._originToolId?.toHexString());
		});
	});
});
