import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { AccountTypesController } from './account-types.controller';
import { AccountTypesService } from './account-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountTypesController],
  providers: [AccountTypesService],
})
export class AccountTypesModule {}