import chai from 'chai';

const { expect } = chai;
import { excludeAttributesFromSanitization } from '../../src/hooks/sanitizationExceptions';

describe('excludeAttributesFromSanitization tests', () => {
	it('should add safeAttributes attribute with proper value to context object if path match the path specified in the context', () => {
		const contextWithoutSafeAttribute = {
			path: 'test',
		};
		const result = excludeAttributesFromSanitization('test', ['url'])(contextWithoutSafeAttribute);
		return result.then((contextWithSafeAttribute) => {
			expect(contextWithSafeAttribute.safeAttributes).to.be.not.undefined;
			expect(contextWithSafeAttribute.safeAttributes).to.eql(['url']);
		});
	});
	it('should NOT add safeAttributes attribute to context object if path does not match the path specified in the context', () => {
		const contextWithoutSafeAttribute = {
			path: 'test',
		};
		const result = excludeAttributesFromSanitization('test', 'url')(context);
		return result.then((context) => {
			expect(context.safeAttributes).to.be.undefined;
		});
	});
});
