import { VideoConferenceElement, isVideoConferenceElement } from './video-conference-element.do';
import { BoardNodeProps } from './types/board-node-props';

describe('VideoConferenceElement', () => {
	let videoConferenceElement: VideoConferenceElement;

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
		videoConferenceElement = new VideoConferenceElement({
			...boardNodeProps,
			title: 'Example',
		});
	});

	it('should be instance of VideoConferenceElement', () => {
		expect(isVideoConferenceElement(videoConferenceElement)).toBe(true);
	});

	it('should not be instance of VideoConferenceElement', () => {
		expect(isVideoConferenceElement({})).toBe(false);
	});

	it('should return title', () => {
		expect(videoConferenceElement.title).toBe('Example');
	});

	it('should set title', () => {
		videoConferenceElement.title = 'New title';
		expect(videoConferenceElement.title).toBe('New title');
	});

	it('should not have child', () => {
		expect(videoConferenceElement.canHaveChild()).toBe(false);
	});
});
