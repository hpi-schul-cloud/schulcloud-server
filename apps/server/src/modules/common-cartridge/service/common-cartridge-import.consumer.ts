import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { JwtPayload } from '@infra/auth-guard';
import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter, CardControllerCreateElement201Response } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter, FilesStorageClientConfig } from '@infra/files-storage-client';
import { CommonCartridgeEvents, CommonCartridgeExchange, ImportCourseParams } from '@infra/rabbitmq';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import {
	CommonCartridgeFileFolderResourceProps,
	CommonCartridgeFileResourceProps,
	CommonCartridgeOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '../import/common-cartridge-import.types';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';

const DEPTH_BOARD = 0;
const DEPTH_COLUMN = 1;
const DEPTH_CARD = 2;
const DEPTH_CARD_ELEMENTS = 3;

const DEFAULT_NEW_COURSE_COLOR = '#455B6A';

interface ColumnResource {
	column: CommonCartridgeOrganizationProps;
	isResourceColumn: boolean;
}

@Injectable()
export class CommonCartridgeImportConsumer {
	constructor(
		private readonly configService: ConfigService<FilesStorageClientConfig, true>,
		private readonly httpService: HttpService,
		private readonly coursesClient: CoursesClientAdapter,
		private readonly boardsClient: BoardsClientAdapter,
		private readonly columnClient: ColumnClientAdapter,
		private readonly cardClient: CardClientAdapter,
		private readonly fileClient: FilesStorageClientAdapter,
		private readonly commonCartridgeImportMapper: CommonCartridgeImportMapper,
		private readonly logger: Logger
	) {
		this.logger.setContext(CommonCartridgeImportConsumer.name);
	}

	@RabbitSubscribe({
		exchange: CommonCartridgeExchange,
		routingKey: CommonCartridgeEvents.IMPORT_COURSE,
		queue: CommonCartridgeEvents.IMPORT_COURSE,
	})
	public async importFile(@RabbitPayload() payload: ImportCourseParams): Promise<void> {
		const file = await this.fetchFile(payload);

		if (!file) {
			return;
		}

		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await Promise.allSettled([
			this.createCourse(parser, payload),
			this.fileClient.deleteFile(payload.jwt, payload.fileRecordId),
		]);
	}

	private async fetchFile(payload: ImportCourseParams): Promise<Buffer | null> {
		const baseUrl = this.configService.getOrThrow<string>('FILES_STORAGE__SERVICE_BASE_URL');
		const fullFileUrl = new URL(payload.fileUrl, baseUrl).toString();

		const getRequestObservable = this.httpService.get(fullFileUrl.toString(), {
			responseType: 'arraybuffer',
			headers: {
				Authorization: `Bearer ${payload.jwt}`,
			},
		});
		const response = await lastValueFrom(getRequestObservable);
		const data = Buffer.isBuffer(response.data) ? response.data : null;

		return data;
	}

	private async createCourse(parser: CommonCartridgeFileParser, payload: ImportCourseParams): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		const course = await this.coursesClient.createCourse(payload.jwt, {
			name: courseName,
			color: DEFAULT_NEW_COURSE_COLOR,
		});

		await this.createBoards(course.courseId, parser, payload);
	}

	private async createBoards(
		parentId: string,
		parser: CommonCartridgeFileParser,
		payload: ImportCourseParams
	): Promise<void> {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);

		// INFO: for await keeps the order of the boards in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the boards would be random
		for await (const board of boards) {
			const response = await this.boardsClient.createBoard(payload.jwt, {
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});

			await this.createColumns(response.id, board, parser, payload);
		}
	}

	private async createColumns(
		boardId: string,
		board: CommonCartridgeOrganizationProps,
		parser: CommonCartridgeFileParser,
		payload: ImportCourseParams
	): Promise<void> {
		const columns: ColumnResource[] = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_COLUMN && organization.path.startsWith(board.identifier)
			)
			.map((column) => {
				return {
					column,
					isResourceColumn: column.isResource,
				};
			});

		// INFO: for await keeps the order of the columns in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the columns would be random
		for await (const columnResource of columns) {
			columnResource.isResourceColumn
				? await this.createColumnWithResource(parser, boardId, columnResource.column, payload)
				: await this.createColumn(parser, boardId, columnResource.column, payload);
		}
	}

	private async createColumnWithResource(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		payload: ImportCourseParams
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(payload.jwt, boardId);
		await this.columnClient.updateBoardColumnTitle(payload.jwt, columnResponse.id, { title: columnProps.title });

		await this.createCardElementWithResource(parser, columnResponse, columnProps, payload);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		payload: ImportCourseParams
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(payload.jwt, boardId);
		await this.columnClient.updateBoardColumnTitle(payload.jwt, columnResponse.id, { title: columnProps.title });

		const cards = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_CARD && organization.path.startsWith(columnProps.path)
			);

		for (const card of cards) {
			card.isResource
				? await this.createCardElementWithResource(parser, columnResponse, card, payload)
				: await this.createCard(parser, columnResponse, card, payload);
		}
	}

	private async createCardElementWithResource(
		parser: CommonCartridgeFileParser,
		columnResponse: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		payload: ImportCourseParams
	): Promise<void> {
		const card = await this.columnClient.createCard(payload.jwt, columnResponse.id, {});

		await this.createCardElement(parser, card.id, cardProps, payload);
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		payload: ImportCourseParams
	): Promise<void> {
		const card = await this.columnClient.createCard(payload.jwt, column.id, {});
		await this.cardClient.updateCardTitle(payload.jwt, card.id, {
			title: cardProps.title,
		});

		const organizations = parser.getOrganizations();
		const cardElements = organizations.filter(
			(organization) => organization.pathDepth >= DEPTH_CARD_ELEMENTS && organization.path.startsWith(cardProps.path)
		);

		for await (const cardElement of cardElements) {
			await this.createCardElement(parser, card.id, cardElement, payload);
		}
	}

	private async createCardElement(
		parser: CommonCartridgeFileParser,
		cardId: string,
		cardElementProps: CommonCartridgeOrganizationProps,
		payload: ImportCourseParams
	): Promise<void> {
		if (!cardElementProps.isResource) return;

		const resource = parser.getResource(cardElementProps);

		if (!resource) return;

		const contentElementType = this.commonCartridgeImportMapper.mapResourceTypeToContentElementType(resource.type);

		if (!contentElementType) return;

		const resourceBody = this.commonCartridgeImportMapper.mapResourceToContentBody(
			resource,
			parser.options.inputFormat
		);

		if (!resourceBody) return;

		const contentElement = await this.cardClient.createCardElement(payload.jwt, cardId, {
			type: contentElementType,
		});

		if (resource.type === 'file' || resource.type === 'fileFolder') {
			await this.uploadFiles(payload, resource, contentElement);
		}

		await this.cardClient.updateCardElement(payload.jwt, contentElement.id, {
			data: resourceBody,
		});
	}

	private async uploadFiles(
		payload: ImportCourseParams,
		resource: CommonCartridgeFileResourceProps | CommonCartridgeFileFolderResourceProps,
		cardElement: CardControllerCreateElement201Response
	): Promise<void> {
		const { schoolId } = this.getJwtPayload(payload.jwt);

		const files: File[] = [];
		switch (resource.type) {
			case 'file':
				files.push(resource.file);
				break;
			case 'fileFolder':
				files.push(...resource.files);
				break;
		}

		const uploadPromises = files.map((file) =>
			this.fileClient.upload(payload.jwt, schoolId, 'school', cardElement.id, 'boardnodes', file)
		);
		await Promise.all(uploadPromises);
	}

	private getJwtPayload(jwtToken: string): JwtPayload {
		const decodedJwt = jwt.decode(jwtToken, { json: true }) as JwtPayload;

		return decodedJwt;
	}
}
