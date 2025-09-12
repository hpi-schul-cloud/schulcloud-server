import { CommonCartrideImportClientAdapter } from '@infra/common-cartridge-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';
import {
	CreateCcCardBodyParams,
	CreateCcCardElementBodyParams,
	CreateCcColumnBodyParams,
	CreateCcCourseBodyParams,
} from '@infra/common-cartridge-client/generated';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { LegacyLogger } from '@core/logger';

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

	public async importCourse(file: Buffer /* currentUser: ICurrentUser*/): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		this.logger.log(`Importing course with title`);
		await this.importClient.importCourse(this.prepareCourse(parser));
	}

	private prepareCourse(parser: CommonCartridgeFileParser): CreateCcCourseBodyParams {
		this.logger.log(`Preparing course`);
		const courseName = parser.getTitle() ?? 'Untitled Course';
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);
		const createCcCourseBodyParams: CreateCcCourseBodyParams = {
			name: courseName,
			color: DEFAULT_NEW_COURSE_COLOR,
			columnBoard: boards.map((board) => {
				return {
					title: board.title,
					layout: 'columns',
					parentType: 'course',
					columns: this.getColumnsForBoard(board, parser),
				};
			}),
		};

		return createCcCourseBodyParams;
	}

	private getColumnsForBoard(
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcColumnBodyParams[] {
		this.logger.log(`Getting columns for board ${board.title}`);
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
			this.logger.log(`Creating column with resource ${column.title}`);
			this.createColumnWithResource(column, parser);
		}

		for (const column of columnsWithoutResource) {
			this.logger.log(`Creating column without resource ${column.title}`);
			this.createColumnWithoutResource(parser, column);
		}
		return [];
	}

	private createColumnWithoutResource(
		parser: CommonCartridgeFileParser,
		columnProps: CommonCartridgeOrganizationProps
	): CreateCcColumnBodyParams {
		const cards = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(columnProps.path)
			);
		const cardsWithResource = cards.filter((card) => card.isResource);

		for (const card of cardsWithResource) {
			this.createCardElementWithResource(parser, card);
		}

		const cardsWithoutResource = cards.filter((card) => !card.isResource);

		for (const card of cardsWithoutResource) {
			this.createCard(parser, card);
		}

		const column: CreateCcColumnBodyParams = {
			title: columnProps.title,
			cards: [this.createCardElementWithResource(parser, columnProps)],
		};

		return column;
	}

	private createCard(
		parser: CommonCartridgeFileParser,
		cardProps: CommonCartridgeOrganizationProps
	): CreateCcCardBodyParams {
		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);

		const cardElementsToCreate: CreateCcCardElementBodyParams[] = [];

		for (const cardElement of cardElements) {
			const mappedCardElement = this.createCardElement(parser, cardElement);

			cardElementsToCreate.push(
				mappedCardElement
					? mappedCardElement
					: {
							xmlPath: '',
							type: 'unknown',
							data: undefined!,
					  }
			);
		}

		const card: CreateCcCardBodyParams = {
			title: cardProps.title,
			cardElements: cardElementsToCreate,
		};

		return card;
	}

	private createColumnWithResource(
		columnProps: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcColumnBodyParams {
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

		return cardElement;
	}

	private getCardsForColumn(
		column: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser
	): CreateCcCardBodyParams[] {
		const cards: CommonCartridgeOrganizationProps[] = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(column.identifier)
			);
		const cardBodyParams = cards.map((card) => this.mapper.mapCardToCardBodyParams(card));

		return cardBodyParams;
	}

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
