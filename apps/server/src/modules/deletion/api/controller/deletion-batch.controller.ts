import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ApiValidationError } from '@shared/common/error';
import { DeletionBatchSummary } from '../../domain/service';
import { DeletionBatchMapper } from '../uc/deletion-batch.mapper';
import { DeletionBatchUc } from '../uc/deletion-batch.uc';
import { CreateDeletionBatchBodyParams } from './dto';
import { DeletionBatchPaginationParams } from './dto/request/deletion-batch-pagination.params';
import { DeletionBatchItemResponse } from './dto/response/deletion-batch-item.response';
import { DeletionBatchListResponse } from './dto/response/deletion-batch-list.response';
import { DeletionBatchDetailsResponse } from './dto/response/deletion-batch-details.response';

@ApiTags('DeletionBatch')
@XApiKeyAuthentication()
@Controller('deletion-batches')
export class DeletionBatchController {
	constructor(private readonly deletionBatchUc: DeletionBatchUc) {}

	@Get('')
	@ApiOperation({ summary: 'Get a list of deletion batches' })
	@HttpCode(200)
	public async getBatches(@Query() pagination: DeletionBatchPaginationParams): Promise<DeletionBatchListResponse> {
		const findOptions: IFindOptions<DeletionBatchSummary> = { pagination };

		const summaries = await this.deletionBatchUc.getDeletionBatchSummaries(findOptions);

		const response = DeletionBatchMapper.mapToDeletionBatchListResponse(summaries, pagination);

		return response;
	}

	@Get(':batchId')
	@ApiOperation({
		summary: 'Retrieving details of performed or planned deletion batch',
	})
	@HttpCode(200)
	public async getBatchDetails(@Param('batchId') batchId: string): Promise<DeletionBatchDetailsResponse> {
		const details = await this.deletionBatchUc.getDeletionBatchDetails(batchId);

		const response = DeletionBatchMapper.mapToDeletionBatchDetailsResponse(details);

		return response;
	}

	@Post('')
	@ApiOperation({ summary: 'Create a new deletion batch' })
	@ApiResponse({ status: 201, type: DeletionBatchItemResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@HttpCode(201)
	public async createBatch(@Body() params: CreateDeletionBatchBodyParams): Promise<DeletionBatchItemResponse> {
		const summary = await this.deletionBatchUc.createDeletionBatch(params);

		const response = DeletionBatchMapper.mapToDeletionBatchItemResponse(summary);

		return response;
	}

	@Delete(':batchId')
	@HttpCode(204)
	@ApiOperation({
		summary: 'Delete a deletion batch',
	})
	public async deleteBatch(@Param('batchId') batchId: EntityId): Promise<void> {
		await this.deletionBatchUc.deleteDeletionBatch(batchId);
	}

	@Post(':batchId/execute')
	@HttpCode(202)
	@ApiOperation({
		summary: '"Queueing" a deletion request for specific batch',
	})
	public async createDeletionRequestsForBatch(@Param('batchId') batchId: EntityId): Promise<DeletionBatchItemResponse> {
		const deleteNow = new Date(); // TODO allow override

		const summary = await this.deletionBatchUc.createDeletionRequestForBatch(batchId, deleteNow);

		const response = DeletionBatchMapper.mapToDeletionBatchItemResponse(summary);

		return response;
	}
}
