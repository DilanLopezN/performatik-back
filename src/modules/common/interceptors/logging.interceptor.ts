import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`,
          );
        },
        error: () => {
          const duration = Date.now() - startTime;

          this.logger.warn(
            `${method} ${url} ERROR - ${duration}ms - ${ip} - ${userAgent}`,
          );
        },
      }),
    );
  }
}
