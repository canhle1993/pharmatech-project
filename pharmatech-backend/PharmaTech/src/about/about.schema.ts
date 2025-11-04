import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AboutDocument = About & Document;

class TeamMember {
  @Prop() name: string;
  @Prop() position: string;
  @Prop() image?: string;
  @Prop() facebook?: string;
  @Prop() zalo?: string;
  @Prop() linkedin?: string;
}

class Testimonial {
  @Prop() name: string;
  @Prop() position?: string;
  @Prop() content: string;
  @Prop() image?: string;
}

class Intro {
  @Prop() subtitle?: string;
  @Prop() title?: string;
  @Prop() paragraph1?: string;
  @Prop() paragraph2?: string;
  @Prop() signatureImage?: string;
  @Prop() image?: string;
}

class Cta {
  @Prop() backgroundImage?: string;
  @Prop() videoUrl?: string;
}

class Open {
  @Prop() subtitle?: string;
  @Prop() title?: string;
  @Prop() text?: string;
  @Prop() image?: string;
}

class Schedule {
  @Prop() monFri?: string;
  @Prop() satSun?: string;
}

class TeamSection {
  @Prop() title?: string;
}

class TestimonialsSection {
  @Prop() title?: string;
  @Prop() bgColor?: string;
}

@Schema()
export class About {
  @Prop({ required: true }) content: string;
  @Prop() bannerImage?: string;
  @Prop({ type: Intro }) intro?: Intro;
  @Prop({ type: Cta }) cta?: Cta;
  @Prop({ type: Open }) open?: Open;
  @Prop({ type: Schedule }) schedule?: Schedule;
  @Prop({ type: TeamSection }) teamSection?: TeamSection;
  @Prop({ type: TestimonialsSection })
  testimonialsSection?: TestimonialsSection;
  @Prop({ type: [TeamMember] }) team?: TeamMember[];
  @Prop({ type: [Testimonial] }) testimonials?: Testimonial[];
  @Prop({ type: [String] }) brandImages?: string[];
}

export const AboutSchema = SchemaFactory.createForClass(About);
