import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class AccountDTO {
  // _id (ObjectId) -> id (string)
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose({ name: 'id' })
  id: string;

  @Expose()
  name: string;

  @Expose()
  phone?: string;

  @Expose()
  address?: string;

  @Expose()
  gender?: string;

  // Ghép URL ảnh đầy đủ, nếu không có thì trả null
  @Transform(({ obj }) => (obj?.photo ? `${getImageUrl()}${obj.photo}` : null))
  @Expose()
  photo?: string | null;

  @Expose()
  username: string;

  @Expose()
  email: string;

  // Không expose password

  @Expose()
  roles: string[]; // ví dụ: ['user'] | ['admin', 'user']

  // Giữ đúng tên field như schema
  @Expose({ name: 'is_active' })
  is_active: boolean;

  @Expose({ name: 'is_delete' })
  is_delete: boolean;

  @Expose({ name: 'securityCode' })
  securityCode?: string;

  // Định dạng ngày; nếu null/undefined thì trả null
  @Transform(({ obj }) => (obj?.last_login ? new Date(obj.last_login) : null))
  @Expose({ name: 'last_login' })
  last_login?: Date | null;

  @Transform(({ obj }) =>
    obj?.created_at ? moment(obj.created_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string | null;

  @Transform(({ obj }) =>
    obj?.updated_at ? moment(obj.updated_at).format('DD/MM/YYYY HH:mm') : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string | null;

  constructor(partial: Partial<AccountDTO>) {
    Object.assign(this, partial);
  }
}
