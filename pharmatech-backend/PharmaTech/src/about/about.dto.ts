import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  team?: TeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestimonialDto)
  testimonials?: TestimonialDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandImages?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => IntroDto)
  intro?: IntroDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CtaDto)
  cta?: CtaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpenDto)
  open?: OpenDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleDto)
  schedule?: ScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSectionDto)
  teamSection?: TeamSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestimonialsSectionDto)
  testimonialsSection?: TestimonialsSectionDto;
}
