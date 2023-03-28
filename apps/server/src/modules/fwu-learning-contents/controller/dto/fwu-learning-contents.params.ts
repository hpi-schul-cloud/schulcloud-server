import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetFwuLearningContentParams {
	@ApiProperty()
	@Matches('([A-Za-z]|[0-9])+(.html|.css|.mp4|.pdf|.doc|.png|.jpg|.gif|.min.js|.js|.ico|.txt|.min.css)')
	@IsString()
	@IsNotEmpty()
	fwuLearningContent!: string;
}
