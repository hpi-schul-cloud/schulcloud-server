import { Expose } from 'class-transformer';
import { YearsQueryDto, PaginationQueryDto } from '../controller/dto';

export class TaskOption {
    @Expose()
	pagination?: PaginationQueryDto;
	@Expose()
	year?: YearsQueryDto;
}

export type ITaskOption = TaskOption;
