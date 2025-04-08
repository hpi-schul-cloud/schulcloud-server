import { videoConferenceElementFactory } from '../testing';
import { VideoConferenceElement, isVideoConferenceElement } from './video-conference-element.do';

describe('VideoConferenceElement', () => {
	let videoConferenceElement: VideoConferenceElement;

	beforeEach(() => {
		videoConferenceElement = videoConferenceElementFactory.build({
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
