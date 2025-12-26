import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId')!;
    const accessKeyId = this.configService.get<string>('r2.accessKeyId')!;
    const secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey')!;

    this.bucketName = this.configService.get<string>('r2.bucketName')!;
    this.publicUrl = this.configService.get<string>('r2.publicUrl')!;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('R2 client initialized');
  }

  /**
   * Upload a file to R2
   */
  async upload(
    key: string,
    body: Buffer,
    mimeType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: mimeType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        size: body.length,
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a file from R2
   */
  async get(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const bodyContents = await response.Body?.transformToByteArray();

      if (!bodyContents) {
        throw new Error(`File not found: ${key}`);
      }

      return Buffer.from(bodyContents);
    } catch (error) {
      this.logger.error(`Failed to get file: ${key}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files with prefix
   */
  async list(prefix?: string, maxKeys = 1000): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);
      return (
        response.Contents?.map((item) => item.Key).filter(
          (key): key is string => key !== undefined,
        ) || []
      );
    } catch (error) {
      this.logger.error(`Failed to list files`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  async getPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600, contentType } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for downloading
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
  }
}
