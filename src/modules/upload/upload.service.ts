import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { R2Service } from './r2.service';
import { File } from '@prisma/client';

export interface UploadedFile {
  filename: string;
  mimetype: string;
  data: Buffer;
}

export interface UploadOptions {
  folder?: string;
  uploadedBy?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number | undefined;
  private readonly allowedMimeTypes: string[] | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>('upload.maxFileSize');
    this.allowedMimeTypes = this.configService.get<string[]>(
      'upload.allowedMimeTypes',
    );
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: UploadedFile,
    options: UploadOptions = {},
  ): Promise<File> {
    const { folder = 'uploads', uploadedBy, metadata } = options;

    // Validate file
    this.validateFile(file);

    // Generate unique key
    const fileExtension = this.getFileExtension(file.filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    try {
      // Upload to R2
      const uploadResult = await this.r2Service.upload(
        key,
        file.data,
        file.mimetype,
        metadata,
      );

      // Save to database
      const savedFile = await this.prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.filename,
          mimeType: file.mimetype,
          size: file.data.length,
          key,
          url: uploadResult.url,
          uploadedBy,
          metadata: metadata || {},
        },
      });

      this.logger.log(`File uploaded: ${savedFile.id}`);
      return savedFile;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: UploadedFile[],
    options: UploadOptions = {},
  ): Promise<File[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, options)),
    );
    return results;
  }

  /**
   * Get file by ID
   */
  async getFile(id: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  /**
   * Get file by key
   */
  async getFileByKey(key: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { key },
    });

    if (!file) {
      throw new NotFoundException(`File with key ${key} not found`);
    }

    return file;
  }

  /**
   * Get all files with pagination
   */
  async getFiles(
    page = 1,
    limit = 20,
    uploadedBy?: string,
  ): Promise<{ files: File[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const where = uploadedBy ? { uploadedBy } : {};

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      files,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete file
   */
  async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id);

    try {
      // Delete from R2
      await this.r2Service.delete(file.key);

      // Delete from database
      await this.prisma.file.delete({
        where: { id },
      });

      this.logger.log(`File deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get presigned upload URL (for direct client upload)
   */
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    folder = 'uploads',
  ): Promise<{ url: string; key: string; expiresIn: number }> {
    this.validateMimeType(mimeType);

    const fileExtension = this.getFileExtension(filename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    const url = await this.r2Service.getPresignedUploadUrl(key, {
      expiresIn: 3600,
      contentType: mimeType,
    });

    return {
      url,
      key,
      expiresIn: 3600,
    };
  }

  /**
   * Confirm upload (after client direct upload)
   */
  async confirmUpload(
    key: string,
    originalName: string,
    mimeType: string,
    size: number,
    uploadedBy?: string,
  ): Promise<File> {
    // Verify file exists in R2
    const exists = await this.r2Service.exists(key);
    if (!exists) {
      throw new BadRequestException('File not found in storage');
    }

    // Extract filename from key
    const filename = key.split('/').pop();

    // Save to database
    const file = await this.prisma.file.create({
      data: {
        filename: filename ?? '',
        originalName,
        mimeType,
        size,
        key,
        url: this.r2Service.getPublicUrl(key),
        uploadedBy,
      },
    });

    return file;
  }

  /**
   * Validate file
   */
  private validateFile(file: UploadedFile): void {
    if (!file.data || file.data.length === 0) {
      throw new BadRequestException('File is empty');
    }

    if (this.maxFileSize && file.data.length > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    this.validateMimeType(file.mimetype);
  }

  /**
   * Validate MIME type
   */
  private validateMimeType(mimeType: string): void {
    if (!this.allowedMimeTypes || !this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed. Allowed types: ${this.allowedMimeTypes?.join(', ') || 'none configured'}`,
      );
    }
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot) : '';
  }
}
