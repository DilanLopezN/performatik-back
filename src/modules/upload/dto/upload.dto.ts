import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class PresignedUploadDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Folder to store the file' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'R2 object key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({ description: 'User ID who uploaded the file' })
  @IsString()
  @IsOptional()
  uploadedBy?: string;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  uploadedBy?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedFilesResponseDto {
  @ApiProperty({ type: [FileResponseDto] })
  files: FileResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  pages: number;
}
