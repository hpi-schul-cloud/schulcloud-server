import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { IToolFeatures, ToolFeatures } from '@modules/tool/tool-config';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeTextEditorElement, LinkElement } from '@shared/domain/domainobject';
import {
	collaborativeTextEditorElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	setupEntities,
} from '@shared/testing';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../../copy-helper';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';
import { SchoolSpecificFileCopyServiceFactory } from './school-specific-file-copy-service.factory';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

describe(RecursiveCopyVisitor.name, () => {
	let module: TestingModule;

	let fileCopyServiceFactory: DeepMocked<SchoolSpecificFileCopyServiceFactory>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

	let toolFeatures: IToolFeatures;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RecursiveCopyVisitor,
				{
					provide: SchoolSpecificFileCopyServiceFactory,
					useValue: createMock<SchoolSpecificFileCopyServiceFactory>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						ctlToolsCopyEnabled: true,
					},
				},
			],
		}).compile();

		fileCopyServiceFactory = module.get(SchoolSpecificFileCopyServiceFactory);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolFeatures = module.get(ToolFeatures);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('visitLinkElementAsync', () => {
		const setup = (options: { withFileCopy: boolean } = { withFileCopy: false }) => {
			const fileCopyServiceMock = createMock<SchoolSpecificFileCopyService>();
			fileCopyServiceFactory.build.mockReturnValue(fileCopyServiceMock);
			const sourceFileId = 'abe223e22134';
			const imageUrl = `https://abc.de/file/${sourceFileId}`;

			let newFileId: string | undefined;
			let copyResultMock: CopyFileDto[] = [];
			if (options?.withFileCopy) {
				newFileId = 'bbbbbbb123';
				copyResultMock = [
					{
						sourceId: sourceFileId,
						id: newFileId,
						name: 'myfile.jpg',
					},
				];
			}

			fileCopyServiceMock.copyFilesOfParent.mockResolvedValueOnce(copyResultMock);
			return { fileCopyServiceMock, imageUrl, newFileId };
		};

		describe('when copying a LinkElement without preview url', () => {
			it('should not call fileCopyService', async () => {
				const { fileCopyServiceMock } = setup();

				const linkElement = linkElementFactory.build();
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock, contextExternalToolService, toolFeatures);

				await visitor.visitLinkElementAsync(linkElement);

				expect(fileCopyServiceMock.copyFilesOfParent).not.toHaveBeenCalled();
			});
		});

		describe('when copying a LinkElement with preview image', () => {
			it('should call fileCopyService', async () => {
				const { fileCopyServiceMock, imageUrl } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock, contextExternalToolService, toolFeatures);

				await visitor.visitLinkElementAsync(linkElement);

				expect(fileCopyServiceMock.copyFilesOfParent).toHaveBeenCalledWith(
					expect.objectContaining({ sourceParentId: linkElement.id })
				);
			});

			it('should replace fileId in imageUrl', async () => {
				const { fileCopyServiceMock, imageUrl, newFileId } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock, contextExternalToolService, toolFeatures);

				await visitor.visitLinkElementAsync(linkElement);
				const copy = visitor.copyMap.get(linkElement.id) as LinkElement;

				expect(copy.imageUrl).toEqual(expect.stringContaining(newFileId as string));
			});
		});

		describe('when copying a LinkElement with an unmatched image url', () => {
			it('should remove the imageUrl', async () => {
				const { fileCopyServiceMock } = setup({ withFileCopy: true });

				const linkElement = linkElementFactory.build({ imageUrl: `https://abc.de/file/unknown-file-id` });
				const visitor = new RecursiveCopyVisitor(fileCopyServiceMock, contextExternalToolService, toolFeatures);

				await visitor.visitLinkElementAsync(linkElement);
				const copy = visitor.copyMap.get(linkElement.id) as LinkElement;

				expect(copy.imageUrl).toEqual('');
			});
		});
	});

	describe('when copying a media board', () => {
		const setup = () => {
			const element = mediaExternalToolElementFactory.build();
			const line = mediaLineFactory.build({ children: [element] });
			const board = mediaBoardFactory.build({ children: [line] });

			const visitor = new RecursiveCopyVisitor(
				createMock<SchoolSpecificFileCopyService>(),
				contextExternalToolService,
				toolFeatures
			);

			return {
				board,
				visitor,
			};
		};

		it('should fail', async () => {
			const { visitor, board } = setup();

			await visitor.visitMediaBoardAsync(board);

			expect(visitor.resultMap.get(board.id)).toEqual<CopyStatus>({
				type: CopyElementType.MEDIA_BOARD,
				status: CopyStatusEnum.NOT_DOING,
				elements: [
					{
						type: CopyElementType.MEDIA_LINE,
						status: CopyStatusEnum.NOT_DOING,
						elements: [
							{
								type: CopyElementType.MEDIA_EXTERNAL_TOOL_ELEMENT,
								status: CopyStatusEnum.NOT_DOING,
							},
						],
					},
				],
			});
		});
	});

	describe('visitCollaborativeTextEditorElementAsync', () => {
		const setup = () => {
			const collaborativeTextEditorElement = collaborativeTextEditorElementFactory.build();
			const visitor = new RecursiveCopyVisitor(
				createMock<SchoolSpecificFileCopyService>(),
				contextExternalToolService,
				toolFeatures
			);
			const nowMock = new Date(2020, 1, 1, 0, 0, 0);

			jest.useFakeTimers();
			jest.setSystemTime(nowMock);

			return {
				collaborativeTextEditorElement,
				visitor,
				nowMock,
			};
		};

		it('should add status to the resultMap', async () => {
			const { visitor, collaborativeTextEditorElement, nowMock } = setup();

			await visitor.visitCollaborativeTextEditorElementAsync(collaborativeTextEditorElement);

			const status = visitor.resultMap.get(collaborativeTextEditorElement.id);
			const expectedCopyEntity = expect.objectContaining({
				id: expect.any(String),
				createdAt: nowMock,
				updatedAt: nowMock,
			}) as CollaborativeTextEditorElement;

			expect(status).toEqual<CopyStatus>({
				copyEntity: expectedCopyEntity,
				type: CopyElementType.COLLABORATIVE_TEXT_EDITOR_ELEMENT,
				status: CopyStatusEnum.SUCCESS,
			});
		});

		it('should add the element to the copyMap', async () => {
			const { visitor, collaborativeTextEditorElement, nowMock } = setup();

			await visitor.visitCollaborativeTextEditorElementAsync(collaborativeTextEditorElement);

			const copyMapElement = visitor.copyMap.get(collaborativeTextEditorElement.id);
			expect(copyMapElement?.id).toBeDefined();
			expect(copyMapElement?.createdAt).toEqual(nowMock);
			expect(copyMapElement?.updatedAt).toEqual(nowMock);
		});
	});
});
