import { externalToolElementFactory } from '../testing';
import { ExternalToolElement, isExternalToolElement } from './external-tool-element.do';

describe('ExternalToolElement', () => {
	let externalToolElement: ExternalToolElement;

	beforeEach(() => {
		externalToolElement = externalToolElementFactory.build({
			contextExternalToolId: 'test-id',
		});
	});

	it('should be instance of ExternalToolElement', () => {
		expect(isExternalToolElement(externalToolElement)).toBe(true);
	});

	it('should not be instance of ExternalToolElement', () => {
		expect(isExternalToolElement({})).toBe(false);
	});

	it('should return contextExternalToolId', () => {
		expect(externalToolElement.contextExternalToolId).toBe('test-id');
	});

	it('should set contextExternalToolId', () => {
		externalToolElement.contextExternalToolId = 'new-id';
		expect(externalToolElement.contextExternalToolId).toBe('new-id');
	});

	it('should not have child', () => {
		expect(externalToolElement.canHaveChild()).toBe(false);
	});
});
