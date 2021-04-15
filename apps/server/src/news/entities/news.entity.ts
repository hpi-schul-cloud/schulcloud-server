import { ApiProperty } from "@nestjs/swagger";

export class NewsEntity {
  @ApiProperty()
  title: string;
  @ApiProperty()
  body: string;
  @ApiProperty()
  publishedOn: Date;
}
