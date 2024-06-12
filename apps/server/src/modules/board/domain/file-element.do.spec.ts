import { FileElement, isFileElement } from './file-element.do';
import { BoardNodeProps } from './types';

describe('FileElement', () => {
	let fileElement: FileElement;

	const boardNodeProps: BoardNodeProps = {
		id: '1',
		path: '',
		level: 1,
		position: 1,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		fileElement = new FileElement({
			...boardNodeProps,
			alternativeText: 'Test alt text',
			caption: 'Test caption',
		});
	});

	it('should be instance of FileElement', () => {
		expect(isFileElement(fileElement)).toBe(true);
	});

	it('should not be instance of FileElement', () => {
		expect(isFileElement({})).toBe(false);
	});

	it('should return alternativeText', () => {
		expect(fileElement.alternativeText).toBe('Test alt text');
	});

	it('should set alternativeText', () => {
		fileElement.alternativeText = 'New alt text';
		expect(fileElement.alternativeText).toBe('New alt text');
	});

	it('should return caption', () => {
		expect(fileElement.caption).toBe('Test caption');
	});

	it('should set caption', () => {
		fileElement.caption = 'New caption';
		expect(fileElement.caption).toBe('New caption');
	});

	it('should not have child', () => {
		expect(fileElement.canHaveChild()).toBe(false);
	});
});
