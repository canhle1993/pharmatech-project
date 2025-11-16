import { Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { getImageUrl } from './config.util';

export class AccountDTO {
  @Transform(({ obj }) => obj?._id?.toString())
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  phone?: string;

  @Expose()
  email?: string;

  @Expose()
  address?: string;

  @Expose()
  gender?: string;

  @Expose()
  dob?: Date;

  @Transform(({ obj }) => {
    if (!obj?.photo) return null;
    return obj.photo.startsWith('http')
      ? obj.photo
      : `${getImageUrl()}${obj.photo}`;
  })
  @Expose()
  photo?: string | null;

  @Expose()
  username: string;

  @Expose()
  roles: string[];

  @Expose({ name: 'is_active' })
  is_active: boolean;

  @Expose({ name: 'is_delete' })
  is_delete: boolean;

  @Expose({ name: 'securityCode' })
  securityCode?: string;

  @Expose()
  otpExpiredAt?: Date;

  @Transform(({ obj }) => (obj?.last_login ? new Date(obj.last_login) : null))
  @Expose({ name: 'last_login' })
  last_login?: Date | null;

  @Transform(({ obj }) =>
    obj?.created_at
      ? moment(obj.created_at, moment.ISO_8601).format('DD/MM/YYYY HH:mm')
      : null,
  )
  @Expose({ name: 'created_at' })
  created_at?: string | null;

  @Transform(({ obj }) =>
    obj?.updated_at
      ? moment(obj.updated_at, moment.ISO_8601).format('DD/MM/YYYY HH:mm')
      : null,
  )
  @Expose({ name: 'updated_at' })
  updated_at?: string | null;

  // 🎓 Học vấn
  @Expose()
  education?: {
    education_level?: string;
    major?: string;
    school_name?: string;
    graduation_year?: number;
  };

  // 💼 Kinh nghiệm
  @Expose()
  experience?: {
    company_name?: string;
    job_title?: string;
    working_years?: number;
    responsibilities?: string;
  };

  // 🧠 Kỹ năng & Ngôn ngữ
  @Expose()
  skills?: string[];

  @Expose()
  languages?: string[];

  // 🌐 Lĩnh vực chuyên môn
  @Expose()
  field?: string[];

  // 🏙️ Khu vực mong muốn
  @Expose()
  preferred_area?: string;

  // 📄 Hồ sơ ứng tuyển
  @Transform(({ obj }) =>
    obj?.resume ? `${getImageUrl()}${obj.resume}` : null,
  )
  @Expose()
  resume?: string | null;

  @Expose()
  introduction?: string;

  @Expose()
  expected_salary?: number;

  @Expose()
  job_type?: string;

  @Expose()
  available_from?: Date;

  constructor(partial: Partial<AccountDTO>) {
    Object.assign(this, partial);
  }
}
