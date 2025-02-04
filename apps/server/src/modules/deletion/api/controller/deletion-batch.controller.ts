import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletionBatchUc } from '../uc/deletion-batch.uc';
import { CreateDeletionBatchBodyParams } from './dto';
import { DeletionBatchItemResponse } from './dto/deletion-batch-item.response';
import { DeletionBatchListResponse } from './dto/deletion-batch-list.response';
import { UsersByRoleResponse } from './dto/users-by-role.response';

@ApiTags('DeletionBatch')
@XApiKeyAuthentication()
@Controller('deletion-batches')
export class DeletionBatchController {
	constructor(private readonly deletionBatchUc: DeletionBatchUc) {}

	@Get('')
	@ApiOperation({ summary: 'Get a list of deletion batches' })
	@HttpCode(200)
	public async getBatches(): Promise<DeletionBatchListResponse> {
		const summaries = await this.deletionBatchUc.getDeletionBatches();

		const items = summaries.data.map((obj) => {
			const item = new DeletionBatchItemResponse({
				batchId: obj.id,
				status: obj.status,
				usersByRole: obj.usersByRole.map(
					(u) => new UsersByRoleResponse({ roleName: u.roleName, userCount: u.userCount })
				),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return item;
		});

		const response = new DeletionBatchListResponse(items, items.length);

		return response;
	}

	@Post('')
	@HttpCode(201)
	@ApiOperation({ summary: 'Create a new deletion batch' })
	public async createBatch(@Body() params: CreateDeletionBatchBodyParams): Promise<CreateDeletionBatchBodyParams> {
		await this.deletionBatchUc.createDeletionBatch(params);

		return Promise.resolve(params);
	}
}
