import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from './contact.schema';
import { CreateContactDto, UpdateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async findAll(): Promise<Contact> {
    const contacts = await this.contactModel.find().exec();
    return contacts.length > 0 ? contacts[0] : null;
  }

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const createdContact = new this.contactModel(createContactDto);
    return createdContact.save();
  }

  async update(id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
    return this.contactModel
      .findByIdAndUpdate(id, updateContactDto, { new: true })
      .exec();
  }
}
