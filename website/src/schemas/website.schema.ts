import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { AllWebsiteStatus, AllWebsiteStatusEnum } from '@mujtaba-web/common';

export interface WebsiteDocument extends HydratedDocument<Website> {
  id: string;
  websiteName: string;
  userId: string;
  status: AllWebsiteStatusEnum;
  version: number;
}

@Schema({
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
})
export class Website {
  @Prop({ required: true, unique: true })
  websiteName: string;

  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    enum: AllWebsiteStatus,
    default: AllWebsiteStatus.DOWN,
  })
  status: AllWebsiteStatusEnum;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);

// Version
WebsiteSchema.set('versionKey', 'version');
WebsiteSchema.plugin(updateIfCurrentPlugin);
