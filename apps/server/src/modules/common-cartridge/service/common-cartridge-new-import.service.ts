import { CommonCartrideImportClientAdapter } from '@infra/common-cartridge-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';
import {
	CreateCcBoardBodyParams,
	CreateCcCardBodyParams,
	CreateCcCardElementBodyParams,
	CreateCcColumnBodyParams,
	CreateCcCourseBodyParams,
} from '@infra/common-cartridge-client/generated';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { LegacyLogger } from '@core/logger';
import { ICurrentUser } from '@infra/auth-guard';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
const DEPTH_CARD = 2;
const DEPTH_CARD_ELEMENTS = 3;

const DEFAULT_NEW_COURSE_COLOR = '#455B6A';
@Injectable()
export class CommonCartridgeNewImportService {
	constructor(
		private readonly importClient: CommonCartrideImportClientAdapter,
		private readonly mapper: CommonCartridgeImportMapper,
		private readonly logger: LegacyLogger
	) {}

	public async importCourse(file: Buffer, currentUser: ICurrentUser): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		this.logger.log(`Importing course with title`);
		this.logger.log(`user info: ${currentUser.userId}`);

		await this.importClient.importCourse(this.prepareCourse(parser));

		this.logger.log(`Course imported successfully`);
	}

	private prepareCourse(parser: CommonCartridgeFileParser): CreateCcCourseBodyParams {
		this.logger.log(`Preparing course`);
		const courseName = parser.getTitle() ?? 'Untitled Course';
		const createCcCourseBodyParams: CreateCcCourseBodyParams = {
			name: courseName,
			color: DEFAULT_NEW_COURSE_COLOR,
			columnBoard: this.createBoards(parser),
		};

		this.logger.log(`this course was prepared: ${JSON.stringify(createCcCourseBodyParams)}`);
		this.logger.log(`Course prepared successfully!!!!!`);

		return createCcCourseBodyParams;
	}

	private createBoards(parser: CommonCartridgeFileParser): CreateCcBoardBodyParams[] {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);

		this.logger.log(`Found ${boards.length} boards`);

		const boardsToCreate: CreateCcBoardBodyParams[] = [];

		boards.map((board) => {
			boardsToCreate.push({
				title: board.title,
				layout: 'columns',
				parentType: 'course',
				columns: this.createColumnsForBoard(board, parser),
			});
		});

		return boardsToCreate;
	}

	private createColumnsForBoard(
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcColumnBodyParams[] {
		this.logger.log(`Getting columns for board ${board.title}`);

		const columns: CreateCcColumnBodyParams[] = [];
		const columnsWithResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_COLUMN &&
					organization.path.startsWith(board.identifier) &&
					organization.isResource
			);

		this.logger.log(`Found ${columnsWithResource.length} columns with resource for board ${board.title}`);
		const columnsWithoutResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_COLUMN &&
					organization.path.startsWith(board.identifier) &&
					!organization.isResource
			);
		this.logger.log(`Found ${columnsWithoutResource.length} columns without resource for board ${board.title}`);

		for (const column of columnsWithResource) {
			columns.push(this.createColumnWithResource(column, parser));
		}

		for (const column of columnsWithoutResource) {
			columns.push(this.createColumnWithoutResource(column, parser));
		}

		return columns;
	}

	private createColumnWithoutResource(
		columnProps: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcColumnBodyParams {
		this.logger.log(`Creating column without resource: ${columnProps.title}`);
		const cards: CreateCcCardBodyParams[] = [];
		const cardsWithResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_CARD &&
					organization.path.startsWith(columnProps.path) &&
					organization.isResource
			);
		this.logger.log(`Found ${cardsWithResource.length} cards with resource for column ${columnProps.title}`);

		for (const card of cardsWithResource) {
			cards.push(this.createCardElementWithResource(parser, card));
		}

		const cardsWithoutResource = parser
			.getOrganizations()
			.filter(
				(organization) =>
					organization.pathDepth === DEPTH_CARD &&
					organization.path.startsWith(columnProps.path) &&
					!organization.isResource
			);
		this.logger.log(`Found ${cardsWithoutResource.length} cards without resource for column ${columnProps.title}`);

		for (const card of cardsWithoutResource) {
			cards.push(this.createCard(parser, card));
		}

		const column: CreateCcColumnBodyParams = {
			title: columnProps.title,
			cards: cards,
		};

		return column;
	}

	private createCard(
		parser: CommonCartridgeFileParser,
		cardProps: CommonCartridgeOrganizationProps
	): CreateCcCardBodyParams {
		this.logger.log(`Creating card without resource: ${cardProps.title}`);

		const cardElements = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
			);

		const cardElementsToCreate: CreateCcCardElementBodyParams[] = [];

		for (const cardElement of cardElements) {
			const mappedCardElement = this.createCardElement(parser, cardElement);

			cardElementsToCreate.push(mappedCardElement as CreateCcCardElementBodyParams);
		}

		const card: CreateCcCardBodyParams = {
			title: cardProps.title,
			cardElements: cardElementsToCreate,
		};

		this.logger.log(`this card and card elements was created: ${JSON.stringify(card)}`);

		return card;
	}

	private createColumnWithResource(
		columnProps: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcColumnBodyParams {
		this.logger.log(`Creating column with resource: ${columnProps.title}`);
		const column: CreateCcColumnBodyParams = {
			title: columnProps.title,
			cards: [this.createCardElementWithResource(parser, columnProps)],
		};

		return column;
	}

	private createCardElementWithResource(
		parser: CommonCartridgeFileParser,
		cardProps: CommonCartridgeOrganizationProps
	): CreateCcCardBodyParams {
		const cardElement = this.createCardElement(parser, cardProps);
		const card: CreateCcCardBodyParams = {
			title: '',
			cardElements: cardElement ? [cardElement] : [],
		};

		return card;
	}

	private createCardElement(
		parser: CommonCartridgeFileParser,
		cardElementProps: CommonCartridgeOrganizationProps
	): CreateCcCardElementBodyParams | undefined {
		if (!cardElementProps.isResource) return;

		const resource = parser.getResource(cardElementProps);

		if (!resource) return;

		const contentElementType = this.mapper.mapResourceTypeToContentElementType(resource.type);

		if (!contentElementType) return;

		const resourceBody = this.mapper.mapResourceToContentBody(resource, cardElementProps, parser.options.inputFormat);

		if (!resourceBody) return;

		const cardElement: CreateCcCardElementBodyParams = {
			type: contentElementType,
			xmlPath: cardElementProps.resourcePath,
			data: { data: resourceBody },
		};

		this.logger.log(`Created card element with resource: ${JSON.stringify(cardElement)}`);

		return cardElement;
	}

	// private getCardsForColumn(
	// 	column: CommonCartridgeOrganizationProps,
	// 	parser: CommonCartridgeFileParser
	// ): CreateCcCardBodyParams[] {
	// 	const cards: CommonCartridgeOrganizationProps[] = parser
	// 		.getOrganizations()
	// 		.filter(
	// 			(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(column.identifier)
	// 		);
	// 	const cardBodyParams = cards.map((card) => this.mapper.mapCardToCardBodyParams(card));

	// 	return cardBodyParams;
	// }

	// private getCardElementsForCard(
	// 	card: CommonCartridgeOrganizationProps,
	// 	parser: CommonCartridgeFileParser
	// ): CreateCcCardElementBodyParams[] {
	// 	const cardElements: CommonCartridgeOrganizationProps[] = parser
	// 		.getOrganizations()
	// 		.filter(
	// 			(organization) =>
	// 				organization.pathDepth === DEPTH_CARD_ELEMENTS && organization.path.startsWith(card.identifier)
	// 		);
	// 	const cardElementBodyParams = cardElements.map((cardElement) =>
	// 		this.mapper.mapCardElementToCardElementBodyParams(cardElement)
	// 	);

	// 	return cardElementBodyParams;
	// }
}
