import { Expose } from 'class-transformer';
import { YearsQueryDto, PaginationQueryDto } from '../controller/dto';

export class TaskQuery {
    @Expose()
	pagination?: PaginationQueryDto;
	@Expose()
	year?: YearsQueryDto;
}

export type ITaskQuery = TaskQuery;
