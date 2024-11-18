import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MetaDataEntityType } from '@modules/meta-tag-extractor/types';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { MetaTagExtractorAdapterService } from '@src/infra/meta-tag-extractor-client';
import {
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../../controller/dto';
import { BoardNodeRepo } from '../../repo';
import {
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
} from '../../testing';
import { ContentElementUpdateService } from './content-element-update.service';

describe('ContentElementUpdateService', () => {
	let module: TestingModule;
	let service: ContentElementUpdateService;
	let repo: DeepMocked<BoardNodeRepo>;
	let metaTagExtractorAdapterService: DeepMocked<MetaTagExtractorAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementUpdateService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: MetaTagExtractorAdapterService,
					useValue: createMock<MetaTagExtractorAdapterService>(),
				},
			],
		}).compile();

		service = module.get(ContentElementUpdateService);
		metaTagExtractorAdapterService = module.get(MetaTagExtractorAdapterService);
		repo = module.get(BoardNodeRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should update FileElement', async () => {
		const element = fileElementFactory.build();
		const content = new FileContentBody();
		content.caption = 'caption';
		content.alternativeText = 'alternativeText';

		await service.updateContent(element, content);

		expect(element.caption).toBe('caption');
		expect(element.alternativeText).toBe('alternativeText');
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should update LinkElement', async () => {
		const element = linkElementFactory.build();
		const content = new LinkContentBody();
		content.url = 'https://example.com/';

		const metaData = {
			title: 'title',
			description: 'description',
			url: 'https://example.com/',
			imageUrl: 'https://example.com/image.jpg',
			type: 'unknown' as MetaDataEntityType,
		};

		metaTagExtractorAdapterService.getMetaData.mockResolvedValue(metaData);

		await service.updateContent(element, content);

		expect(element.url).toBe('https://example.com/');
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should update RichTextElement', async () => {
		const element = richTextElementFactory.build();
		const content = new RichTextContentBody();
		content.text = 'text';
		content.inputFormat = InputFormat.PLAIN_TEXT;

		await service.updateContent(element, content);

		expect(element.text).toBe('text');
		expect(element.inputFormat).toBe(InputFormat.PLAIN_TEXT);
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should update DrawingElement', async () => {
		const element = drawingElementFactory.build();
		const content = new DrawingContentBody();
		content.description = 'description';

		await service.updateContent(element, content);

		expect(element.description).toBe('description');
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should update SubmissionContainerElement', async () => {
		const element = submissionContainerElementFactory.build();
		const content = new SubmissionContainerContentBody();
		content.dueDate = new Date();

		await service.updateContent(element, content);

		expect(element.dueDate).toEqual(content.dueDate);
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should update ExternalToolElement', async () => {
		const element = externalToolElementFactory.build();
		const content = new ExternalToolContentBody();
		content.contextExternalToolId = 'contextExternalToolId';

		await service.updateContent(element, content);

		expect(element.contextExternalToolId).toBe('contextExternalToolId');
		expect(repo.save).toHaveBeenCalledWith(element);
	});

	it('should throw error for unknown element type', async () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const element = {} as any;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const content = {} as any;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		await expect(service.updateContent(element, content)).rejects.toThrowError(
			"Cannot update element of type: 'Object'"
		);
	});
});
