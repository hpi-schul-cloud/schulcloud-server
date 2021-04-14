import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly body: string;
  @ApiProperty()
  readonly publishedOn: Date;
}
