import { ObjectId } from '@mikro-orm/mongodb';
import { h5pElementFactory } from '../testing';
import { H5pElement, isH5pElement } from './h5p-element.do';

describe(H5pElement.name, () => {
	const setup = () => {
		const contentId = new ObjectId().toHexString();

		const h5pElement = h5pElementFactory.build({
			contentId,
		});

		return {
			h5pElement,
			contentId,
		};
	};

	it('should be instance of H5pElement', () => {
		const { h5pElement } = setup();

		expect(isH5pElement(h5pElement)).toBe(true);
	});

	it('should not be instance of H5pElement', () => {
		expect(isH5pElement({})).toBe(false);
	});

	it('should return contentId', () => {
		const { h5pElement, contentId } = setup();

		expect(h5pElement.contentId).toBe(contentId);
	});

	it('should set contentId', () => {
		const { h5pElement } = setup();

		const newId = new ObjectId().toHexString();
		h5pElement.contentId = newId;

		expect(h5pElement.contentId).toBe(newId);
	});

	it('should not have child', () => {
		const { h5pElement } = setup();

		expect(h5pElement.canHaveChild()).toBe(false);
	});
});
