import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ collection: 'saved_jobs', timestamps: true })
export class SavedJob {
  @Prop({ required: true })
  user_id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career',
    required: true,
  })
  job_id: mongoose.Types.ObjectId;
}

export const SavedJobSchema = SchemaFactory.createForClass(SavedJob);
