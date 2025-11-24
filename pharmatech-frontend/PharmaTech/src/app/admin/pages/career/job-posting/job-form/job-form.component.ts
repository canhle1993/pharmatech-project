import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// 🧩 PrimeNG modules
import { InputText } from 'primeng/inputtext';
import { Editor } from 'primeng/editor';
import { Toast } from 'primeng/toast';
import { AutoComplete } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';

import { CareerService } from '../../../../../services/career.service';
import { Career } from '../../../../../entities/career.entity';

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoComplete,
    InputText,
    Editor,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './job-form.component.html',
  styleUrls: ['./job-form.component.css'],
})
export class JobFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  jobId!: string;
  bannerPreview: string | null = null;
  loading = false;
  today = new Date().toISOString().split('T')[0];

  // 🧩 Dropdown data
  genderOptions = ['Any', 'Male', 'Female'];
  levelOptions = ['Intern', 'Junior', 'Mid-level', 'Senior', 'Manager'];
  workTypeOptions = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];
  educationOptions = ['High School', 'College', 'Bachelor', 'Master', 'PhD'];
  areaOptions = ['North', 'Central', 'South'];
  maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  industryOptions = ['Pharma', 'IT', 'Manufacturing', 'Sales', 'Research'];
  fieldOptions = ['Production', 'R&D', 'Quality Control', 'HR', 'Finance'];

  // 🧠 Danh sách ngành nghề (industry)
  industryList = [
    { name: 'Pharmaceutical Manufacturing' },
    { name: 'Biotechnology' },
    { name: 'Medical Devices' },
    { name: 'Chemical Engineering' },
    { name: 'Healthcare' },
    { name: 'Food & Beverage Processing' },
    { name: 'Nutraceuticals' },
    { name: 'Clinical Research' },
    { name: 'Equipment Distribution' },
    { name: 'Laboratory Supplies' },
    { name: 'Regulatory Consulting' },
  ];

  // 🧠 Danh sách lĩnh vực (field)
  fieldList = [
    { name: 'Production' },
    { name: 'Research & Development (R&D)' },
    { name: 'Quality Assurance (QA)' },
    { name: 'Quality Control (QC)' },
    { name: 'Validation & Calibration' },
    { name: 'Maintenance & Engineering' },
    { name: 'Procurement & Supply Chain' },
    { name: 'Sales & Marketing' },
    { name: 'Regulatory' },
    { name: 'Finance & Accounting' },
    { name: 'Human Resources' },
    { name: 'IT Support' },
  ];

  // 🧠 Danh sách ngôn ngữ (language)
  languageList = [
    { name: 'English' },
    { name: 'Vietnamese' },
    { name: 'Japanese' },
    { name: 'Korean' },
    { name: 'Chinese (Mandarin)' },
    { name: 'French' },
    { name: 'German' },
    { name: 'Spanish' },
    { name: 'Hindi' },
    { name: 'Thai' },
    { name: 'Other' },
  ];

  // 🧠 Skill & Benefit list (suggestions)
  skillsList = [
    { name: 'GMP Compliance' },
    { name: 'Quality Control' },
    { name: 'Pharmaceutical Manufacturing' },
    { name: 'Process Validation' },
    { name: 'Equipment Maintenance' },
    { name: 'Documentation & Reporting' },
    { name: 'Research & Development (R&D)' },
    { name: 'SOP Management' },
    { name: 'Safety & Hygiene Standards' },
    { name: 'Machine Operation' },
  ];

  benefitsList = [
    { name: 'Health insurance' },
    { name: 'Annual performance bonus' },
    { name: 'Paid annual leave' },
    { name: 'Professional training programs' },
    { name: 'Overtime allowance' },
    { name: 'Meal and transportation allowance' },
    { name: 'Career advancement opportunities' },
    { name: 'Friendly work environment' },
    { name: 'Safety and hygiene equipment' },
  ];

  // 📋 Recruitment dropdown options
  levelList = [
    'Intern',
    'Fresher',
    'Junior',
    'Middle',
    'Senior',
    'Supervisor',
    'Assistant Manager',
    'Manager',
    'Director',
  ];

  workTypeList = [
    'Full-time',
    'Part-time',
    'Remote',
    'Hybrid',
    'Shift-based',
    'Freelance',
    'Internship',
  ];

  educationList = [
    'High School',
    'Vocational / Technical',
    'College',
    'Bachelor’s Degree',
    'Master’s Degree',
    'PhD',
    'Other',
  ];

  areaList = [
    'Hanoi',
    'Ho Chi Minh City',
    'Da Nang',
    'Hai Phong',
    'Can Tho',
    'Binh Duong',
    'Dong Nai',
    'Bac Ninh',
    'Hai Duong',
    'Hue',
    'Quang Ninh',
  ];

  genderList = ['Any', 'Male', 'Female', 'Other'];

  maritalStatusList = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];

  nationalityList = [
    'Vietnamese',
    'Japanese',
    'Korean',
    'Chinese',
    'Thai',
    'Filipino',
    'Indonesian',
    'Indian',
    'American',
    'British',
    'German',
    'French',
    'Other',
  ];

  // 🕐 Working hours & days & age range
  workingHoursList = [
    '08:00 - 17:00',
    '07:30 - 16:30',
    '09:00 - 18:00',
    'Shift-based',
    'Flexible Hours',
  ];

  workingDaysList = [
    'Mon - Fri',
    'Mon - Sat (Alternate)',
    'Mon - Sat',
    '5 days/week',
    '6 days/week',
    'Rotational shifts',
  ];

  ageRangeList = ['18 - 24', '25 - 30', '31 - 40', '41 - 50', 'Above 50'];

  filteredSkills: any[] = [];
  filteredBenefits: any[] = [];
  filteredIndustry: any[] = [];
  filteredField: any[] = [];
  filteredLanguage: any[] = [];

  filteredLevels: string[] = [];
  filteredWorkTypes: string[] = [];
  filteredEducations: string[] = [];
  filteredAreas: string[] = [];
  filteredGenders: string[] = [];
  filteredMarital: string[] = [];
  filteredNationality: string[] = [];
  filteredWorkingHours: string[] = [];
  filteredWorkingDays: string[] = [];
  filteredAgeRanges: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private careerService: CareerService,
    private message: MessageService
  ) {}

  // 🟢 Lifecycle
  ngOnInit() {
    this.initForm();
    this.jobId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEditMode = !!this.jobId;
    if (this.isEditMode) this.loadJob();
  }

  // 🧩 Form setup
  private initForm() {
    this.form = this.fb.group(
      {
        // 🧱 Basic
        title: ['', Validators.required],
        department: ['', Validators.required],
        location: ['', Validators.required],
        salary_range: [''],

        // 🧾 Description
        description: ['', Validators.required],
        requirements: [''],

        // 📋 Recruitment
        level: [''],
        experience: [''],
        min_experience: [''],
        work_type: [''],
        quantity: [null],
        area: [''],
        gender: ['Any'],
        age_range: [''],
        education_level: [''],
        working_hours: [''],
        working_days: [''],
        nationality: [''],
        industry: [[]],
        field: [[]],
        language: [[]],
        marital_status: [''],

        // 💎 Skills & Benefits
        skills: [[]],
        benefits: [[]],

        // 🗓️ Dates & Meta
        posted_date: [null],
        expiration_date: [null],
        posted_by: ['', Validators.required],
        banner: [''],
      },
      {
        validators: [this.dateRangeValidator], // ✅ custom validator
      }
    );
  }

  private dateRangeValidator(group: FormGroup) {
    const postedCtrl = group.get('posted_date');
    const expireCtrl = group.get('expiration_date');

    if (!postedCtrl || !expireCtrl) return null;

    const posted = postedCtrl.value;
    const expire = expireCtrl.value;

    postedCtrl.setErrors(null);
    expireCtrl.setErrors(null);

    if (posted && expire) {
      const postedDate = new Date(posted);
      const expireDate = new Date(expire);

      if (postedDate > expireDate) {
        postedCtrl.setErrors({ dateInvalid: true });
        expireCtrl.setErrors({ dateInvalid: true });
        return { dateInvalid: true };
      }
    }

    return null;
  }

  // 🧩 Khi click dropdown thì hiển thị full list
  onDropdownClick(type: string) {
    switch (type) {
      case 'industry':
        this.filteredIndustry = [...this.industryList];
        break;
      case 'field':
        this.filteredField = [...this.fieldList];
        break;
      case 'language':
        this.filteredLanguage = [...this.languageList];
        break;
      case 'skills':
        this.filteredSkills = [...this.skillsList];
        break;
      case 'benefits':
        this.filteredBenefits = [...this.benefitsList];
        break;
    }
  }

  // ✅ Cho phép thêm giá trị mới bằng tay (nhấn Enter)
  addCustomValue(type: string, event: any) {
    const inputValue = event.target.value?.trim();
    if (!inputValue) return;

    const currentValues = this.form.get(type)?.value || [];
    const isDuplicate = currentValues.some(
      (v: any) => v.name?.toLowerCase() === inputValue.toLowerCase()
    );

    if (!isDuplicate) {
      const newItem = { name: inputValue };
      this.form.get(type)?.setValue([...currentValues, newItem]);
    }

    event.target.value = ''; // clear input
  }

  private async loadJob() {
    try {
      this.loading = true;
      const job = (await this.careerService.findById(this.jobId)) as Career;

      this.form.patchValue({
        ...job,
        posted_date: job.posted_date
          ? new Date(job.posted_date).toISOString().split('T')[0]
          : null,

        industry: (job.industry || []).map((i: any) =>
          typeof i === 'string' ? { name: i } : i
        ),
        field: (job.field || []).map((f: any) =>
          typeof f === 'string' ? { name: f } : f
        ),
        language: (job.language || []).map((l: any) =>
          typeof l === 'string' ? { name: l } : l
        ),

        // Giữ nguyên skill + benefit
        skills: (job.skills || []).map((s: any) =>
          typeof s === 'string' ? { name: s } : s
        ),
        benefits: (job.benefits || []).map((b: any) =>
          typeof b === 'string' ? { name: b } : b
        ),
      });

      this.bannerPreview = job.banner ?? null;
    } catch {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load job data',
      });
    } finally {
      this.loading = false;
    }
  }

  // 🖼️ File upload preview
  onFileSelect(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.form.patchValue({ banner: file });
    const reader = new FileReader();
    reader.onload = () => (this.bannerPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  // 🧩 Filter skills & benefits
  filterSkills(event: any) {
    const query = event.query.toLowerCase();
    this.filteredSkills = this.skillsList.filter((skill) =>
      skill.name.toLowerCase().includes(query)
    );
  }

  filterBenefits(event: any) {
    const query = event.query.toLowerCase();
    this.filteredBenefits = this.benefitsList.filter((b) =>
      b.name.toLowerCase().includes(query)
    );
  }
  // 🧩 Filter functions
  filterIndustry(event: any) {
    const query = event.query.toLowerCase();
    this.filteredIndustry = this.industryList.filter((i) =>
      i.name.toLowerCase().includes(query)
    );
  }

  filterField(event: any) {
    const query = event.query.toLowerCase();
    this.filteredField = this.fieldList.filter((f) =>
      f.name.toLowerCase().includes(query)
    );
  }

  filterLanguage(event: any) {
    const query = event.query.toLowerCase();
    this.filteredLanguage = this.languageList.filter((l) =>
      l.name.toLowerCase().includes(query)
    );
  }

  // 🔍 Filter recruitment dropdown
  filterRecruitment(event: any, type: string) {
    const query = event.query.toLowerCase();

    switch (type) {
      case 'level':
        this.filteredLevels = this.levelList.filter((l) =>
          l.toLowerCase().includes(query)
        );
        break;
      case 'work_type':
        this.filteredWorkTypes = this.workTypeList.filter((w) =>
          w.toLowerCase().includes(query)
        );
        break;
      case 'education_level':
        this.filteredEducations = this.educationList.filter((e) =>
          e.toLowerCase().includes(query)
        );
        break;
      case 'area':
        this.filteredAreas = this.areaList.filter((a) =>
          a.toLowerCase().includes(query)
        );
        break;
      case 'gender':
        this.filteredGenders = this.genderList.filter((g) =>
          g.toLowerCase().includes(query)
        );
        break;
      case 'marital_status':
        this.filteredMarital = this.maritalStatusList.filter((m) =>
          m.toLowerCase().includes(query)
        );
        break;
      case 'nationality':
        this.filteredNationality = this.nationalityList.filter((n) =>
          n.toLowerCase().includes(query)
        );
        break;

      case 'working_hours':
        this.filteredWorkingHours = this.workingHoursList.filter((h) =>
          h.toLowerCase().includes(query)
        );
        break;
      case 'working_days':
        this.filteredWorkingDays = this.workingDaysList.filter((d) =>
          d.toLowerCase().includes(query)
        );
        break;
      case 'age_range':
        this.filteredAgeRanges = this.ageRangeList.filter((a) =>
          a.toLowerCase().includes(query)
        );
        break;
    }
  }

  // 🧩 Avoid duplicate selections
  onIndustrySelect() {
    const industry = this.form.value.industry || [];
    const unique = industry.filter(
      (v: any, i: number, arr: any[]) =>
        arr.findIndex((s) => s.name === v.name) === i
    );
    this.form.patchValue({ industry: unique });
  }

  onFieldSelect() {
    const field = this.form.value.field || [];
    const unique = field.filter(
      (v: any, i: number, arr: any[]) =>
        arr.findIndex((s) => s.name === v.name) === i
    );
    this.form.patchValue({ field: unique });
  }

  onLanguageSelect() {
    const lang = this.form.value.language || [];
    const unique = lang.filter(
      (v: any, i: number, arr: any[]) =>
        arr.findIndex((s) => s.name === v.name) === i
    );
    this.form.patchValue({ language: unique });
  }

  onSkillSelect() {
    const skills = this.form.value.skills || [];
    const unique = skills.filter(
      (v: any, i: number, arr: any[]) =>
        arr.findIndex((s) => s.name === v.name) === i
    );
    this.form.patchValue({ skills: unique });
  }

  onBenefitSelect() {
    const benefits = this.form.value.benefits || [];
    const unique = benefits.filter(
      (v: any, i: number, arr: any[]) =>
        arr.findIndex((b) => b.name === v.name) === i
    );
    this.form.patchValue({ benefits: unique });
  }

  // 📨 Submit handler
  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;

    // 🧠 Chuẩn hóa mảng
    const fixedSkills = (raw.skills || []).map((s: any) =>
      typeof s === 'string' ? s : s?.name
    );
    const fixedBenefits = (raw.benefits || []).map((b: any) =>
      typeof b === 'string' ? b : b?.name
    );

    const fixedIndustry = (raw.industry || []).map((i: any) =>
      typeof i === 'string' ? i : i?.name
    );
    const fixedField = (raw.field || []).map((f: any) =>
      typeof f === 'string' ? f : f?.name
    );
    const fixedLanguage = (raw.language || []).map((l: any) =>
      typeof l === 'string' ? l : l?.name
    );

    const payload = {
      ...raw,
      skills: fixedSkills,
      benefits: fixedBenefits,
      industry: fixedIndustry,
      field: fixedField,
      language: fixedLanguage,
    };

    console.log('📦 Final Payload:', payload);

    const fd = new FormData();
    for (const key of Object.keys(payload)) {
      const value = (payload as any)[key];
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        value.forEach((item) => fd.append(`${key}[]`, item));
      } else {
        fd.append(key, value);
      }
    }

    this.loading = true;

    try {
      if (this.isEditMode) {
        await this.careerService.update(this.jobId, fd);
        this.message.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Job updated successfully',
        });
      } else {
        await this.careerService.create(fd);
        this.message.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Job created successfully',
        });
      }

      const msg = this.isEditMode
        ? {
            severity: 'success',
            summary: 'Updated',
            detail: 'Job updated successfully',
          }
        : {
            severity: 'success',
            summary: 'Created',
            detail: 'Job created successfully',
          };

      this.router.navigate(['/admin/career/job-posting'], {
        state: { toastMessage: msg },
      });
    } catch (err) {
      console.error('❌ Error submitting form:', err);
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    } finally {
      this.loading = false;
    }
  }

  // 🧠 Theo dõi giá trị đang gõ cho từng trường chip
  typedValue: Record<string, string> = {
    industry: '',
    field: '',
    language: '',
    skills: '',
    benefits: '',
  };

  // Khi user đang gõ
  onTyping(event: any, type: string) {
    this.typedValue[type] = event?.target?.value?.trim() || '';
  }

  // Khi bấm nút ➕
  addManualChip(type: string) {
    const control = this.form.get(type);
    if (!control) return;

    const value = this.typedValue[type];
    if (!value) return;

    const current = control.value || [];
    const isDuplicate = current.some(
      (v: any) => v.name?.toLowerCase() === value.toLowerCase()
    );

    if (!isDuplicate) {
      control.setValue([...current, { name: value }]);
    }

    this.typedValue[type] = '';
    const activeInput = document.activeElement as HTMLInputElement;
    if (activeInput) activeInput.value = '';
  }

  // ❌ Cancel button
  cancel() {
    this.router.navigate(['/admin/career/job-posting']);
  }
}
