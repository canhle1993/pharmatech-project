import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TeamMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  zalo?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;
}

export class TestimonialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class IntroDto {
  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  paragraph1?: string;

  @IsOptional()
  @IsString()
  paragraph2?: string;

  @IsOptional()
  @IsString()
  signatureImage?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class CtaDto {
  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class OpenDto {
  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class ScheduleDto {
  @IsOptional()
  @IsString()
  monFri?: string;

  @IsOptional()
  @IsString()
  satSun?: string;
}

export class TeamSectionDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class TestimonialsSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;
}

export class CreateAboutDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  team?: TeamMemberDto[] | string;

  @IsOptional()
  testimonials?: TestimonialDto[] | string;

  @IsOptional()
  brandImages?: string[] | string;

  @IsOptional()
  intro?: IntroDto | string;

  @IsOptional()
  cta?: CtaDto | string;

  @IsOptional()
  open?: OpenDto | string;

  @IsOptional()
  schedule?: ScheduleDto | string;

  @IsOptional()
  teamSection?: TeamSectionDto | string;

  @IsOptional()
  testimonialsSection?: TestimonialsSectionDto | string;
}
