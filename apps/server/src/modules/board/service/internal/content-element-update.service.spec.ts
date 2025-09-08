import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import {
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	FileFolderContentBody,
	H5pContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
	VideoConferenceContentBody,
} from '../../controller/dto';
import { BoardNodeRepo } from '../../repo';
import {
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	fileFolderElementFactory,
	h5pElementFactory,
	linkElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	videoConferenceElementFactory,
} from '../../testing';
import { ContentElementUpdateService } from './content-element-update.service';

describe('ContentElementUpdateService', () => {
	let module: TestingModule;
	let service: ContentElementUpdateService;
	let repo: DeepMocked<BoardNodeRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementUpdateService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
			],
		}).compile();

		service = module.get(ContentElementUpdateService);
		repo = module.get(BoardNodeRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when the element is a FileElement', () => {
		const setup = () => {
			const element = fileElementFactory.build();
			const content = new FileContentBody();
			content.caption = 'caption';
			content.alternativeText = 'alternativeText';

			return {
				element,
				content,
			};
		};

		it('should update FileElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.caption).toBe('caption');
			expect(element.alternativeText).toBe('alternativeText');
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a FileFolderElement', () => {
		const setup = () => {
			const element = fileFolderElementFactory.build();
			const content = new FileFolderContentBody();
			content.title = 'title';

			return {
				element,
				content,
			};
		};

		it('should update FileFolderElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.title).toBe('title');
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a LinkElement', () => {
		const setup = () => {
			const element = linkElementFactory.build();
			const content = new LinkContentBody();
			content.url = 'http://example.com/';
			content.title = 'title';
			content.description = 'description';
			content.imageUrl = 'relative-image.jpg';

			return {
				element,
				content,
			};
		};

		it('should update LinkElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.url).toBe('http://example.com/');
			expect(element.title).toBe('title');
			expect(element.description).toBe('description');
			expect(element.imageUrl).toBe('relative-image.jpg');
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a RichTextElement', () => {
		const setup = () => {
			const element = richTextElementFactory.build();
			const content = new RichTextContentBody();
			content.text = 'text';
			content.inputFormat = InputFormat.PLAIN_TEXT;

			return {
				element,
				content,
			};
		};

		it('should update RichTextElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.text).toBe('text');
			expect(element.inputFormat).toBe(InputFormat.PLAIN_TEXT);
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a DrawingElement', () => {
		const setup = () => {
			const element = drawingElementFactory.build();
			const content = new DrawingContentBody();
			content.description = 'description';

			return {
				element,
				content,
			};
		};

		it('should update DrawingElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.description).toBe('description');
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a SubmissionContainerElement', () => {
		const setup = () => {
			const element = submissionContainerElementFactory.build();
			const content = new SubmissionContainerContentBody();
			content.dueDate = new Date();

			return {
				element,
				content,
			};
		};

		it('should update SubmissionContainerElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.dueDate).toEqual(content.dueDate);
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a ExternalToolElement', () => {
		const setup = () => {
			const element = externalToolElementFactory.build({
				contextExternalToolId: undefined,
			});
			const content = new ExternalToolContentBody();
			const contextExternalToolId = new ObjectId().toHexString();
			content.contextExternalToolId = contextExternalToolId;

			return {
				element,
				content,
				contextExternalToolId,
			};
		};

		it('should update ExternalToolElement', async () => {
			const { element, content, contextExternalToolId } = setup();

			await service.updateContent(element, content);

			expect(element.contextExternalToolId).toBe(contextExternalToolId);
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a VideoConferenceElement', () => {
		const setup = () => {
			const element = videoConferenceElementFactory.build();
			const content = new VideoConferenceContentBody();
			content.title = 'vc title';

			return {
				element,
				content,
			};
		};

		it('should update VideoConferenceElement', async () => {
			const { element, content } = setup();

			await service.updateContent(element, content);

			expect(element.title).toBe('vc title');
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is a H5pElement', () => {
		const setup = () => {
			const element = h5pElementFactory.build();
			const content = new H5pContentBody();
			const contentId = new ObjectId().toHexString();
			content.contentId = contentId;

			return {
				element,
				content,
				contentId,
			};
		};

		it('should update H5pElement', async () => {
			const { element, content, contentId } = setup();

			await service.updateContent(element, content);

			expect(element.contentId).toBe(contentId);
			expect(repo.save).toHaveBeenCalledWith(element);
		});
	});

	describe('when the element is unkown', () => {
		it('should throw error for unknown element type', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument
			await expect(service.updateContent({} as any, {} as any)).rejects.toThrowError(
				"Cannot update element of type: 'Object'"
			);
		});
	});
});
