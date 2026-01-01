/**
 * Badge Model
 * Represents achievements and badges earned by users
 */

import mongoose, { Schema, model, models } from 'mongoose';

export interface IBadge {
  _id?: string;
  name: string;
  description: string;
  category: 'spending' | 'savings' | 'social' | 'monster' | 'achievement';
  iconUrl?: string;
  xpReward: number;
  earnedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const BadgeSchema = new Schema<IBadge>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['spending', 'savings', 'social', 'monster', 'achievement'],
      required: true,
    },
    iconUrl: {
      type: String,
      trim: true,
    },
    xpReward: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    earnedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true,
      default: 'common',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export const Badge = models.Badge || model<IBadge>('Badge', BadgeSchema);
