import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeSheetModule } from './time-sheet/time-sheet.module';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGODB_URL), TimeSheetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
