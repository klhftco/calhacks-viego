/**
 * Monster Model
 * Represents a monster or egg in the user's island
 */

import mongoose, { Schema, model, models } from 'mongoose';

export interface IMonster {
  _id?: string;
  name: string;
  type: 'egg' | 'monster';
  species: string;
  level: number;
  xp: number;
  hatchProgress?: number; // For eggs: 0-100%
  imageUrl?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  acquiredAt: Date;
  lastFedAt?: Date;
}

const MonsterSchema = new Schema<IMonster>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['egg', 'monster'],
      required: true,
      default: 'egg',
    },
    species: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    hatchProgress: {
      type: Number,
      min: 0,
      max: 100,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      required: true,
      default: 'common',
    },
    acquiredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastFedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export const Monster = models.Monster || model<IMonster>('Monster', MonsterSchema);
