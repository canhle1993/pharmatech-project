import { Career } from './career.entity';

export class SavedJob {
  _id!: string;
  user_id!: string;
  job_id!: Career; // populated Career object
  createdAt!: string;
  updatedAt!: string;
}
