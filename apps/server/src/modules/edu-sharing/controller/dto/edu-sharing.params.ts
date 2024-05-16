import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TicketParams {
  @IsString()
  @ApiProperty({
    description: 'The ticket to be evaluated.',
    required: true,
    nullable: false,
  })
  ticket!: string;
}

export class UserNameParams {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The name of the user the ticket shall be retrieved for.',
    required: false,
    nullable: true,
  })
  userName?: string;
}
