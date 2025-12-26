import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import {
  PresignedUploadDto,
  ConfirmUploadDto,
  FileResponseDto,
  PaginatedFilesResponseDto,
} from './dto/upload.dto';

/**
 * Prisma JsonValue can be: string | number | boolean | object | array | null
 * Your DTO expects metadata as Record<string, any> | undefined.
 */
function normalizeMetadata(metadata: unknown): Record<string, any> | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  return metadata as Record<string, any>;
}

function toFileResponseDto(file: any): FileResponseDto {
  return {
    ...file,
    metadata: normalizeMetadata(file?.metadata),
  };
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a single file
   */
  @Post()
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Folder to store the file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadFile(@Req() request: FastifyRequest): Promise<FileResponseDto> {
    const data = await request.file();

    if (!data) {
      throw new Error('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const folder = (data.fields?.folder as any)?.value || 'uploads';

    const file = await this.uploadService.uploadFile(
      {
        filename: data.filename,
        mimetype: data.mimetype,
        data: buffer,
      },
      { folder },
    );

    return toFileResponseDto(file);
  }

  /**
   * Upload multiple files
   */
  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(
    @Req() request: FastifyRequest,
  ): Promise<FileResponseDto[]> {
    const parts = request.files();
    const files: { filename: string; mimetype: string; data: Buffer }[] = [];
    let folder = 'uploads';

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        files.push({
          filename: part.filename,
          mimetype: part.mimetype,
          data: buffer,
        });
      } else if (part.fieldname === 'folder') {
        folder = (part as any).value;
      }
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, {
      folder,
    });

    return uploadedFiles.map(toFileResponseDto);
  }

  /**
   * Get presigned URL for direct upload
   */
  @Post('presigned')
  @ApiOperation({ summary: 'Get presigned URL for direct client upload' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  async getPresignedUrl(
    @Body() dto: PresignedUploadDto,
  ): Promise<{ url: string; key: string; expiresIn: number }> {
    return this.uploadService.getPresignedUploadUrl(
      dto.filename,
      dto.mimeType,
      dto.folder,
    );
  }

  /**
   * Confirm upload after direct client upload
   */
  @Post('confirm')
  @ApiOperation({ summary: 'Confirm upload after direct client upload' })
  @ApiResponse({ status: 201, description: 'Upload confirmed' })
  async confirmUpload(@Body() dto: ConfirmUploadDto): Promise<FileResponseDto> {
    const file = await this.uploadService.confirmUpload(
      dto.key,
      dto.originalName,
      dto.mimeType,
      dto.size,
      dto.uploadedBy,
    );

    return toFileResponseDto(file);
  }

  /**
   * Get all files with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all files with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'uploadedBy', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Files retrieved' })
  async getFiles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('uploadedBy') uploadedBy?: string,
  ): Promise<PaginatedFilesResponseDto> {
    const result = await this.uploadService.getFiles(page, limit, uploadedBy);

    return {
      ...result,
      files: (result.files ?? []).map(toFileResponseDto),
    };
  }

  /**
   * Get file by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({ status: 200, description: 'File found' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FileResponseDto> {
    const file = await this.uploadService.getFile(id);
    return toFileResponseDto(file);
  }

  /**
   * Delete file
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.uploadService.deleteFile(id);
  }
}
