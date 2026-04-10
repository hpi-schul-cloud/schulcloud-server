import { IsBoolean, IsMongoId } from 'class-validator';

export class UpdateReadersCanEditMessageParams {
	@IsMongoId()
	boardId!: string;

	@IsBoolean()
	readersCanEdit!: boolean;
}
