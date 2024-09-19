import { ObjectId } from '@mikro-orm/mongodb';
import { DeletedElement } from './deleted-element.do';
import { BoardNodeProps, ContentElementType } from './types';

describe(DeletedElement.name, () => {
	let element: DeletedElement;

	const boardNodeProps: BoardNodeProps = {
		id: new ObjectId().toHexString(),
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		element = new DeletedElement({
			...boardNodeProps,
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
		expect(element.description).toEqual(undefined);
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
