import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IFindOptions } from '@shared/domain/interface';
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
	@HttpCode(201)
	@ApiOperation({ summary: 'Create a new deletion batch' })
	public async createBatch(@Body() params: CreateDeletionBatchBodyParams): Promise<DeletionBatchItemResponse> {
		const summary = await this.deletionBatchUc.createDeletionBatch(params);

		const response = DeletionBatchMapper.mapToDeletionBatchItemResponse(summary);

		return response;
	}
}
