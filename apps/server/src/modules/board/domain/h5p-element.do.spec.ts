import { ObjectId } from '@mikro-orm/mongodb';
import { h5pElementFactory } from '../testing';
import { H5pElement, isH5pElement } from './h5p-element.do';

describe('H5pElement', () => {
	let h5pElement: H5pElement;

	beforeEach(() => {
		h5pElement = h5pElementFactory.build({
			contentId: new ObjectId().toHexString(),
		});
	});

	it('should be instance of H5pElement', () => {
		expect(isH5pElement(h5pElement)).toBe(true);
	});

	it('should not be instance of H5pElement', () => {
		expect(isH5pElement({})).toBe(false);
	});

	it('should return contextExternalToolId', () => {
		expect(h5pElement.contentId).toBe('test-id');
	});

	it('should set contextExternalToolId', () => {
		h5pElement.contentId = 'new-id';
		expect(h5pElement.contentId).toBe('new-id');
	});

	it('should not have child', () => {
		expect(h5pElement.canHaveChild()).toBe(false);
	});
});
