import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { RabbitHeader, RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { JwtPayload } from '@infra/auth-guard';
import { BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter, CardControllerCreateElement201Response } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter, FilesStorageClientConfig } from '@infra/files-storage-client';
import { CommonCartridgeEvents, CommonCartridgeExchange, ImportCourseParams } from '@infra/rabbitmq';
import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import {
	CommonCartridgeFileFolderResourceProps,
	CommonCartridgeFileResourceProps,
	CommonCartridgeOrganizationProps,
	DEFAULT_FILE_PARSER_OPTIONS,
} from '../import/common-cartridge-import.types';
import { CommonCartridgeMessageLoggable } from '../loggable/common-cartridge-export-message.loggable';
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

type Payload = ImportCourseParams & { jwt: string };

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
		private readonly logger: Logger,
		private readonly errorHandler: DomainErrorHandler
	) {
		this.logger.setContext(CommonCartridgeImportConsumer.name);
	}

	@RabbitSubscribe({
		exchange: CommonCartridgeExchange,
		routingKey: CommonCartridgeEvents.IMPORT_COURSE,
		queue: CommonCartridgeEvents.IMPORT_COURSE,
	})
	public async importFile(
		@RabbitPayload() payload: ImportCourseParams,
		@RabbitHeader() headers: Record<string, unknown>
	): Promise<void> {
		const jwt = this.getJWT(headers);

		const interceptorReq = axios.interceptors.request.use(
			(req) => req,
			(err) => {
				this.errorHandler.exec(err);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return err;
			}
		);

		const interceptorRes = axios.interceptors.response.use(
			(req) => req,
			(err) => {
				this.errorHandler.exec(err);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return err;
			}
		);

		const file = await this.fetchFile({ ...payload, jwt });

		if (!file) {
			return;
		}

		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await Promise.allSettled([
			this.createCourse(parser, { ...payload, jwt }),
			this.fileClient.deleteFile(jwt, payload.fileRecordId),
		]);

		this.logger.debug(
			new CommonCartridgeMessageLoggable('Import finished', {
				fileRecordId: payload.fileRecordId,
			})
		);

		axios.interceptors.request.eject(interceptorReq);
		axios.interceptors.response.eject(interceptorRes);
	}

	private getJWT(headers: Record<string, unknown>): string {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const authHeader = headers['authorization'] || headers['Authorization'];
		let jwt: string | undefined;

		if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
			jwt = authHeader.slice(7);
		}

		if (!jwt) {
			throw new UnauthorizedException();
		}

		return jwt;
	}

	private async fetchFile(payload: Payload): Promise<Buffer | null> {
		this.logger.debug(
			new CommonCartridgeMessageLoggable('Fetching file for import', {
				fileRecordId: payload.fileRecordId,
				fileUrl: payload.fileUrl,
			})
		);

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

		this.logger.debug(
			new CommonCartridgeMessageLoggable('Fetched file for import', {
				fileRecordId: payload.fileRecordId,
				fileUrl: payload.fileUrl,
				length: data?.length,
			})
		);

		return data;
	}

	private async createCourse(parser: CommonCartridgeFileParser, payload: Payload): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		const course = await this.coursesClient.createCourse(payload.jwt, {
			name: courseName,
			color: DEFAULT_NEW_COURSE_COLOR,
		});

		this.logger.debug(
			new CommonCartridgeMessageLoggable('Created course', {
				fileRecordId: payload.fileRecordId,
			})
		);

		await this.createBoards(course.courseId, parser, payload);
	}

	private async createBoards(parentId: string, parser: CommonCartridgeFileParser, payload: Payload): Promise<void> {
		const boards = parser.getOrganizations().filter((organization) => organization.pathDepth === DEPTH_BOARD);

		// INFO: for await keeps the order of the boards in the same order as the parser.getOrganizations()
		// with Promise.all, the order of the boards would be random
		const createdBoardIds = new Map<string, string>();
		for (const board of boards) {
			const response = await this.boardsClient.createBoard(payload.jwt, {
				title: board.title,
				layout: 'columns',
				parentId,
				parentType: 'course',
			});
			createdBoardIds.set(board.identifier, response.id);

			this.logger.debug(
				new CommonCartridgeMessageLoggable(`Created board ${board.title}`, {
					fileRecordId: payload.fileRecordId,
				})
			);
		}

		for (const [boardIdentifier, boardId] of createdBoardIds) {
			await this.createColumns(boardId, boardIdentifier, parser, payload);
		}
	}

	private async createColumns(
		boardId: string,
		boardIdentifier: string,
		parser: CommonCartridgeFileParser,
		payload: Payload
	): Promise<void> {
		const columns: ColumnResource[] = parser
			.getOrganizations()
			.filter(
				(organization) => organization.pathDepth === DEPTH_COLUMN && organization.path.startsWith(boardIdentifier)
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
		payload: Payload
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(payload.jwt, boardId);
		await this.columnClient.updateBoardColumnTitle(payload.jwt, columnResponse.id, { title: columnProps.title });

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Created column ${columnProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

		await this.createCardElementWithResource(parser, columnResponse, columnProps, payload);
	}

	private async createColumn(
		parser: CommonCartridgeFileParser,
		boardId: string,
		columnProps: CommonCartridgeOrganizationProps,
		payload: Payload
	): Promise<void> {
		const columnResponse = await this.boardsClient.createBoardColumn(payload.jwt, boardId);
		await this.columnClient.updateBoardColumnTitle(payload.jwt, columnResponse.id, { title: columnProps.title });

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Created column ${columnProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

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
		payload: Payload
	): Promise<void> {
		const card = await this.columnClient.createCard(payload.jwt, columnResponse.id, {});

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Created card ${cardProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

		await this.createCardElement(parser, card.id, cardProps, payload);
	}

	private async createCard(
		parser: CommonCartridgeFileParser,
		column: ColumnResponse,
		cardProps: CommonCartridgeOrganizationProps,
		payload: Payload
	): Promise<void> {
		const card = await this.columnClient.createCard(payload.jwt, column.id, {});
		await this.cardClient.updateCardTitle(payload.jwt, card.id, {
			title: cardProps.title,
		});

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Created card ${cardProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

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
		payload: Payload
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

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Created card element ${cardElementProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

		if (resource.type === 'file' || resource.type === 'fileFolder') {
			await this.uploadFiles(payload, resource, contentElement);
		}

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Uploaded files for card element ${cardElementProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);

		await this.cardClient.updateCardElement(payload.jwt, contentElement.id, {
			data: resourceBody,
		});

		this.logger.debug(
			new CommonCartridgeMessageLoggable(`Updated card element ${cardElementProps.identifier}`, {
				fileRecordId: payload.fileRecordId,
			})
		);
	}

	private async uploadFiles(
		payload: Payload,
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
