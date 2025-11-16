import { Injectable } from '@angular/core';
import { AccountService } from './account.service';
import { MessageService } from 'primeng/api';
import { env } from '../enviroments/enviroment';
import { Account } from '../entities/account.entity';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private accountService: AccountService,
    private messageService: MessageService
  ) {}

  // ========================================================
  // 🧩 1️⃣ Chuẩn hóa array dữ liệu (field / skills / languages)
  // ========================================================
  private normalizeArray(arr: any, list: any[]): any[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === 'string') {
          const found = list.find((x) => x.name === item);
          return found || { name: item };
        }
        if (typeof item === 'object' && item.name) return item;
        return null;
      })
      .filter((x) => x !== null);
  }

  // ========================================================
  // 🧩 2️⃣ Validate form trước khi lưu
  // ========================================================
  validateProfile(account: Account): string | null {
    const requiredFields = [
      { key: 'name', label: 'Full name' },
      { key: 'phone', label: 'Phone number' },
      { key: 'address', label: 'Address' },
      { key: 'dob', label: 'Date of birth' },
    ];

    for (const f of requiredFields) {
      const val = (account as any)[f.key];
      if (
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '')
      ) {
        return `${f.label} is required`;
      }
    }

    return null;
  }

  // ========================================================
  // 🧩 3️⃣ Chuẩn hóa dữ liệu sau khi load từ backend
  // ========================================================
  /** ✅ Chuẩn hóa dữ liệu khi load */
  normalizeAccountData(result: any, masterData: any): Account {
    const { fieldList, skillsList, languageList } = masterData;

    const normalizeArray = (arr: any, list: any[]) => {
      if (!arr) return [];
      // arr có thể là ['Production'] hoặc [{ name: 'Production' }]
      return arr.map((item: any) => {
        const name = typeof item === 'string' ? item : item?.name;
        const found = list.find((x) => x.name === name);
        return found ? { ...found } : { name };
      });
    };

    const account: Account = {
      ...result,
      field: normalizeArray(result.field, fieldList),
      skills: normalizeArray(result.skills, skillsList),
      languages: normalizeArray(result.languages, languageList),
      education: result.education ?? {
        education_level: '',
        major: '',
        school_name: '',
        graduation_year: undefined,
      },
      experience: result.experience ?? {
        company_name: '',
        job_title: '',
        working_years: undefined,
        responsibilities: '',
      },
    };

    // ✅ Fix URL ảnh và CV
    if (account.photo && !account.photo.startsWith('http')) {
      account.photo = `${env.baseUrl.replace('/api/', '')}upload/${
        account.photo
      }`;
    }
    if (account.resume && !account.resume.startsWith('http')) {
      account.resume = `${env.baseUrl.replace('/api/', '')}upload/${
        account.resume
      }`;
    }

    // ✅ Chuyển chuỗi ngày sinh (dob) → Date object cho p-datepicker
    if (account.dob && typeof account.dob === 'string') {
      account.dob = new Date(account.dob);
    }

    // ✅ Tính tuổi (Age)
    if (account.dob instanceof Date && !isNaN(account.dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - account.dob.getFullYear();
      const m = today.getMonth() - account.dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < account.dob.getDate())) {
        age--;
      }
      (account as any).age = age; // thêm thuộc tính age để hiển thị ra view
    }

    return account;
  }

  // ========================================================
  // 🧩 4️⃣ Upload avatar / resume (trả về account mới)
  // ========================================================
  async uploadFiles(
    account: Account,
    photo?: File,
    resume?: File
  ): Promise<Account> {
    const updated = { ...account };

    if (photo) {
      console.log('📤 Uploading photo:', photo);
      const upload = await this.accountService.uploadPhoto(photo);
      console.log('✅ Upload success:', upload);
      updated.photo = `${env.baseUrl.replace('/api/', '')}/upload/${
        upload.filename
      }`;
    }

    if (resume) {
      const upload = await this.accountService.uploadResume(resume);
      updated.resume = `${env.baseUrl.replace('/api/', '')}upload/${
        upload.filename
      }`;
    }

    // ✅ Đảm bảo dữ liệu không null
    updated.name = account.name?.trim() || '';
    updated.email = account.email?.trim() || '';
    updated.phone = account.phone?.trim() || '';

    return updated;
  }

  // ========================================================
  // 🧩 5️⃣ Chuẩn hóa dữ liệu gửi lên backend
  // ========================================================
  /** ✅ Chuẩn hóa dữ liệu gửi lên backend */
  buildPayload(account: Account) {
    // clone object
    const payload = {
      ...account,
      photo: account.photo
        ? account.photo.startsWith('data:')
          ? undefined // nếu là base64 thì bỏ qua (đã upload xong rồi)
          : account.photo.split('/upload/').pop() // lấy filename nếu có /upload/
        : undefined,
      resume: account.resume?.split('/upload/')[1],
      field: account.field?.map((f: any) => f.name ?? f),
      skills: account.skills?.map((s: any) => s.name ?? s),
      languages: account.languages?.map((l: any) => l.name ?? l),
    };

    // 🔹 Xóa _id nếu có trong education / experience
    if (payload.education && (payload.education as any)._id) {
      delete (payload.education as any)._id;
    }
    if (payload.experience && (payload.experience as any)._id) {
      delete (payload.experience as any)._id;
    }

    return payload;
  }

  // ========================================================
  // 🧩 6️⃣ Gọi API update và xử lý response
  // ========================================================
  async saveProfile(account: Account, payload: any): Promise<Account | null> {
    try {
      // 🟢 Luôn dùng id chuẩn
      const userId = account._id || account.id;
      if (!userId) {
        throw new Error('Missing userId in account!');
      }

      // 🟢 Gửi update lên backend
      const updated = await this.accountService.update(userId, payload);

      // 🟢 Backend chỉ trả về phần "data" (không chứa _id)
      //    nên phải merge chính xác:
      const merged: any = {
        ...account, // giữ nguyên _id
        ...updated.data, // gộp các field update
        _id: userId, // đảm bảo tồn tại
        id: userId, // FE dùng id cũng ok
      };

      // 🟢 Lưu lại localStorage
      localStorage.setItem('currentUser', JSON.stringify(merged));
      localStorage.setItem('userId', userId);

      // 🟢 Thông báo
      this.messageService.add({
        severity: 'success',
        summary: 'Profile Updated',
        detail: 'Your profile information has been saved successfully!',
      });

      return merged;
    } catch (err) {
      console.error('❌ Error saving profile:', err);

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save profile!',
      });

      return null;
    }
  }
}
