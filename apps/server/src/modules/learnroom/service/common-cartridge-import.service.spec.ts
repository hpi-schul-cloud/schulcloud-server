import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { setupEntities, userFactory } from '@shared/testing';
import { BoardNodeFactory, BoardNodeService } from '@src/modules/board';
import { LinkElement, RichTextElement } from '@src/modules/board/domain';
import { readFile } from 'fs/promises';
import { CommonCartridgeImportMapper } from '../mapper/common-cartridge-import.mapper';
import { CommonCartridgeImportService } from './common-cartridge-import.service';
import { CourseService } from './course.service';

describe('CommonCartridgeImportService', () => {
	let orm: MikroORM;
	let moduleRef: TestingModule;
	let sut: CommonCartridgeImportService;
	let courseServiceMock: DeepMocked<CourseService>;
	let boardNodeFactory: BoardNodeFactory;
	let boardNodeServiceMock: DeepMocked<BoardNodeService>;

	const courseName = 'Test Kurs';

	const board1Title = 'Test Thema';
	const board2Title = '';
	const board3Title = 'Spaltenboard 1';

	const column1ofBoard1Title = 'Test Text';
	const column1ofBoard2Title = 'Test Aufgabe';
	const column1ofBoard3Title = 'Spalte 1';
	const column2ofBoard3Title = 'Spalte 2';
	const column3ofBoard3Title = 'Spalte 3';
	const column4ofBoard3Title = 'Spalte 4';

	const emptyCardTitle = '';
	const card1Title = 'Karte 1';
	const card2Title = 'Karte 2';
	const card3Title = 'Karte 3';
	const card4Title = 'Karte 4';

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	const objectContainingTitle = (title: string) => expect.objectContaining({ title });

	beforeEach(async () => {
		orm = await setupEntities();
		moduleRef = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				CommonCartridgeImportMapper,
				BoardNodeFactory,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		sut = moduleRef.get(CommonCartridgeImportService);
		courseServiceMock = moduleRef.get(CourseService);
		boardNodeFactory = moduleRef.get(BoardNodeFactory);
		boardNodeServiceMock = moduleRef.get(BoardNodeService);
	});

	afterAll(async () => {
		await moduleRef.close();
		await orm.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importFile', () => {
		describe('when the common cartridge is a valid dbc course', () => {
			const setup = async () => {
				const user = userFactory.buildWithId();
				const buffer = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/dbc_course.imscc');

				const spyBuildColumnBoard = jest.spyOn(boardNodeFactory, 'buildColumnBoard');
				const spyBuildColumn = jest.spyOn(boardNodeFactory, 'buildColumn');
				const spyBuildCard = jest.spyOn(boardNodeFactory, 'buildCard');
				const spyBuildContentElement = jest.spyOn(boardNodeFactory, 'buildContentElement');

				return { user, buffer, spyBuildColumnBoard, spyBuildColumn, spyBuildCard, spyBuildContentElement };
			};

			it('should create a course', async () => {
				const { user, buffer } = await setup();

				await sut.importFile(user, buffer);

				expect(courseServiceMock.create).toHaveBeenCalledTimes(1);
				expect(courseServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({ name: courseName }));
			});

			it('should create a column board', async () => {
				const { user, buffer, spyBuildColumnBoard } = await setup();

				await sut.importFile(user, buffer);

				expect(spyBuildColumnBoard).toHaveBeenCalledTimes(3);

				expect(boardNodeServiceMock.addRoot).toHaveBeenCalledWith(objectContainingTitle(board1Title));
				expect(boardNodeServiceMock.addRoot).toHaveBeenCalledWith(objectContainingTitle(board2Title));
				expect(boardNodeServiceMock.addRoot).toHaveBeenCalledWith(objectContainingTitle(board3Title));
			});

			it('should create columns', async () => {
				const { user, buffer, spyBuildColumn } = await setup();

				await sut.importFile(user, buffer);

				expect(spyBuildColumn).toHaveBeenCalledTimes(6);

				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board1Title),
					objectContainingTitle(column1ofBoard1Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board2Title),
					objectContainingTitle(column1ofBoard2Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board3Title),
					objectContainingTitle(column1ofBoard3Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board3Title),
					objectContainingTitle(column2ofBoard3Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board3Title),
					objectContainingTitle(column3ofBoard3Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(board3Title),
					objectContainingTitle(column4ofBoard3Title)
				);
			});

			it('should create cards', async () => {
				const { user, buffer, spyBuildCard } = await setup();

				await sut.importFile(user, buffer);

				expect(spyBuildCard).toHaveBeenCalledTimes(6);

				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column1ofBoard1Title),
					objectContainingTitle(emptyCardTitle)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column1ofBoard2Title),
					objectContainingTitle(emptyCardTitle)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column1ofBoard3Title),
					objectContainingTitle(card1Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column2ofBoard3Title),
					objectContainingTitle(card2Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column3ofBoard3Title),
					objectContainingTitle(card3Title)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(column4ofBoard3Title),
					objectContainingTitle(card4Title)
				);
			});

			it('should create elements', async () => {
				const { user, buffer, spyBuildContentElement } = await setup();

				await sut.importFile(user, buffer);

				expect(spyBuildContentElement).toHaveBeenCalledTimes(6);

				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(emptyCardTitle),
					expect.any(RichTextElement)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(card1Title),
					expect.any(RichTextElement)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(card2Title),
					expect.any(LinkElement)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(card3Title),
					expect.any(LinkElement)
				);
				expect(boardNodeServiceMock.addToParent).toHaveBeenCalledWith(
					objectContainingTitle(card4Title),
					expect.any(RichTextElement)
				);
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledTimes(6);

				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(RichTextElement), {
					text: 'Test Text<p></p><p>Dies ist ein Textinhalt.</p><p></p>',
					inputFormat: InputFormat.RICH_TEXT_CK5_SIMPLE,
				});
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(RichTextElement), {
					text: 'Test Aufgabe<p></p>',
					inputFormat: InputFormat.RICH_TEXT_CK5_SIMPLE,
				});
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(RichTextElement), {
					text: '<p></p><p>Karteninhalt von Karte 1</p><p></p>',
					inputFormat: InputFormat.RICH_TEXT_CK5_SIMPLE,
				});
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(LinkElement), {
					title: 'Example Domain',
					url: 'https://www.example.org/',
				});
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(LinkElement), {
					title: 'Karte 3',
					url: 'https://www.example.org/',
				});
				expect(boardNodeServiceMock.updateContent).toHaveBeenCalledWith(expect.any(RichTextElement), {
					text: '<b>Example Domain</b>',
					inputFormat: 'richTextCk5Simple',
				});
			});
		});
	});
});
