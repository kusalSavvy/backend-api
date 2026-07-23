import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe
  implements PipeTransform<string, bigint>
{
  transform(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'id must be a positive integer',
      );
    }

    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(
        'id is not a valid BIGINT value',
      );
    }
  }
}