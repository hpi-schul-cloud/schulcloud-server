import { deletedElementFactory } from '../testing';
import { DeletedElement } from './deleted-element.do';
import { ContentElementType } from './types';

describe(DeletedElement.name, () => {
	let element: DeletedElement;

	beforeEach(() => {
		element = deletedElementFactory.build({
			deletedElementType: ContentElementType.EXTERNAL_TOOL,
			title: 'Old Tool',
		});
	});

	it('should return title', () => {
		expect(element.title).toEqual('Old Tool');
	});

	it('should set title', () => {
		const title = 'Title';

		element.title = title;

		expect(element.title).toEqual(title);
	});

	it('should return deletedElementType', () => {
		expect(element.deletedElementType).toEqual(ContentElementType.EXTERNAL_TOOL);
	});

	it('should set deletedElementType', () => {
		const description = 'setDescription';

		element.description = description;

		expect(element.description).toEqual(description);
	});

	it('should return description', () => {
		expect(element.description).toEqual('description');
	});

	it('should set description', () => {
		const deletedElementType = ContentElementType.FILE;

		element.deletedElementType = deletedElementType;

		expect(element.deletedElementType).toEqual(deletedElementType);
	});

	it('should not have child', () => {
		expect(element.canHaveChild()).toEqual(false);
	});
});
