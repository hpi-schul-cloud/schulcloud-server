import { CommonCartrideImportClientAdapter } from '@infra/common-cartridge-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';
import { CreateCcColumnBodyParams, CreateCcCourseBodyParams } from '@infra/common-cartridge-client/generated';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
// const DEPTH_CARD = 2;
// const DEPTH_CARD_ELEMENTS = 3;

const DEFAULT_NEW_COURSE_COLOR = '#455B6A';
@Injectable()
export class CommonCartridgeNewImportService {
	constructor(
		private readonly importClient: CommonCartrideImportClientAdapter,
		private readonly mapper: CommonCartridgeImportMapper
	) {}

	public async importCourse(file: Buffer /* currentUser: ICurrentUser*/): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.importClient.importCourse(this.prepareCourse(parser));
	}

	private prepareCourse(parser: CommonCartridgeFileParser): CreateCcCourseBodyParams {
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
		const columns: CommonCartridgeOrganizationProps[] = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_COLUMN && organization.path.startsWith(board.identifier)
			);

		const columnBodyParams = columns.map((column) => this.mapper.mapColumnToColumnBodyParams(column));

		return columnBodyParams;
	}
}
