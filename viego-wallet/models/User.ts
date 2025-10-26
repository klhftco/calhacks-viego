/**
 * User Model
 * Represents a user profile with XP, friends, monsters, and badges
 */

import mongoose, { Schema, model, models } from 'mongoose';
import { IMonster, Monster } from './Monster';
import { IBadge, Badge } from './Badge';
import { AlertPreference, AlertContact } from '@/types/visaAlerts';

export interface IUser {
  _id?: string;
  viegoUID: string; // Our internal unique identifier
  visaUserIdentifier?: string; // Visa's user identifier
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  xp: number;
  schoolName?: string; // General location/school affiliation
  accountStatus: 'active' | 'inactive' | 'suspended';
  preferences?: {
    notifications?: boolean;
    budgetAlerts?: boolean;
  };
  visaAlertDocumentId?: string;
  alertPreferences?: AlertPreference[];
  defaultAlertsPreferences?: AlertContact[];
  friends: mongoose.Types.ObjectId[]; // References to other User documents
  badges: mongoose.Types.ObjectId[]; // References to Badge documents
  monsters: mongoose.Types.ObjectId[]; // References to Monster documents
  createdAt: Date;
  updatedAt: Date;
}

const AlertContactSchema = new Schema<AlertContact>(
  {
    contactType: {
      type: String,
      required: true,
      trim: true,
    },
    contactValue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 254,
    },
    callingCode: {
      type: String,
      trim: true,
      maxlength: 3,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    preferredEmailFormat: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default: 'Active',
    },
  },
  {
    _id: false,
    strict: false,
  }
);

const AlertPreferenceSchema = new Schema<AlertPreference>(
  {
    alertType: {
      type: String,
      required: true,
      trim: true,
    },
    controlType: {
      type: String,
      required: true,
      trim: true,
    },
    contacts: {
      type: [AlertContactSchema],
      default: [],
    },
    status: {
      type: String,
      trim: true,
      default: 'Active',
    },
    portfolioID: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
    strict: false,
  }
);

const UserSchema = new Schema<IUser>(
  {
    viegoUID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      immutable: true,
    },
    visaUserIdentifier: {
      type: String,
      trim: true,
      sparse: true, // Allow null/undefined, but if present must be unique
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    xp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    schoolName: {
      type: String,
      trim: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      required: true,
      default: 'active',
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      budgetAlerts: {
        type: Boolean,
        default: true,
      },
    },
    visaAlertDocumentId: {
      type: String,
      trim: true,
    },
    alertPreferences: {
      type: [AlertPreferenceSchema],
      default: [],
    },
    defaultAlertsPreferences: {
      type: [AlertContactSchema],
      default: [],
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    badges: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Badge',
      },
    ],
    monsters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Monster',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Note: Indexes are already defined on the fields above with index: true

// Prevent model recompilation in development
export const User = models.User || model<IUser>('User', UserSchema);
