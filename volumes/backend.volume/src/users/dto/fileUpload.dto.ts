import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

export class AvatarUploadedResponseDto {
  @ApiProperty()
  status: string;
  message: string;
  data: {
    fileName: string;
  };
}
