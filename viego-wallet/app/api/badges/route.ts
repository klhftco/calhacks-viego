/**
 * Badges API Route
 * Handles fetching and awarding badges to users
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Badge } from '@/models/Badge';

/**
 * GET /api/badges?viegoUID=xxx
 * Fetch all badges for a user
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const viegoUID = searchParams.get('viegoUID');

    if (!viegoUID) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID is required',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findOne({ viegoUID }).populate('badges');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      badges: user.badges,
    });
  } catch (error) {
    console.error('Fetch Badges API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch badges',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/badges
 * Award a badge to a user
 *
 * Body:
 * {
 *   "viegoUID": "viego_xxx",
 *   "badge": {
 *     "name": "First Purchase",
 *     "description": "Made your first purchase!",
 *     "category": "spending",
 *     "xpReward": 50,
 *     "rarity": "common"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (!body.viegoUID || !body.badge) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID and badge data are required',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findOne({ viegoUID: body.viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create the badge
    const newBadge = await (Badge as any).create({
      name: body.badge.name,
      description: body.badge.description,
      category: body.badge.category,
      iconUrl: body.badge.iconUrl,
      xpReward: body.badge.xpReward || 10,
      rarity: body.badge.rarity || 'common',
    });

    // Add badge to user's badges array and award XP
    user.badges.push(newBadge._id as any);
    user.xp += newBadge.xpReward;
    await user.save();

    console.log('✅ Badge awarded to user:', {
      viegoUID: body.viegoUID,
      badgeName: newBadge.name,
      xpAwarded: newBadge.xpReward,
    });

    return NextResponse.json({
      success: true,
      badge: newBadge,
      newXP: user.xp,
      message: `Badge awarded! +${newBadge.xpReward} XP`,
    });
  } catch (error) {
    console.error('Award Badge API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to award badge',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/badges?viegoUID=xxx&badgeId=xxx
 * Remove a badge from a user (admin/testing only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const viegoUID = searchParams.get('viegoUID');
    const badgeId = searchParams.get('badgeId');

    if (!viegoUID || !badgeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID and badgeId are required',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findOne({ viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Get badge to refund XP
    const badge = await (Badge as any).findById(badgeId);

    if (badge) {
      // Refund XP
      user.xp = Math.max(0, user.xp - badge.xpReward);
    }

    // Remove badge from user's array
    user.badges = user.badges.filter(
      (id: any) => id.toString() !== badgeId
    ) as any;
    await user.save();

    // Delete the badge document
    await (Badge as any).findByIdAndDelete(badgeId);

    console.log('✅ Badge removed:', { viegoUID, badgeId });

    return NextResponse.json({
      success: true,
      message: 'Badge removed successfully',
      newXP: user.xp,
    });
  } catch (error) {
    console.error('Delete Badge API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete badge',
      },
      { status: 500 }
    );
  }
}
