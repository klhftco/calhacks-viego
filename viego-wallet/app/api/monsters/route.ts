/**
 * Monsters API Route
 * Handles fetching and updating monsters/eggs for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Monster } from '@/models/Monster';

/**
 * GET /api/monsters?viegoUID=xxx
 * Fetch all monsters for a user
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

    const user = await User.findOne({ viegoUID }).populate('monsters');

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
      monsters: user.monsters,
    });
  } catch (error) {
    console.error('Fetch Monsters API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monsters',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monsters
 * Add a new monster/egg to a user's island
 *
 * Body:
 * {
 *   "viegoUID": "viego_xxx",
 *   "monster": {
 *     "name": "Dragon Egg",
 *     "type": "egg",
 *     "species": "Dragon",
 *     "rarity": "rare"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (!body.viegoUID || !body.monster) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID and monster data are required',
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ viegoUID: body.viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create the monster
    const newMonster = await Monster.create({
      name: body.monster.name,
      type: body.monster.type || 'egg',
      species: body.monster.species,
      level: body.monster.level || 1,
      xp: body.monster.xp || 0,
      hatchProgress: body.monster.type === 'egg' ? 0 : undefined,
      imageUrl: body.monster.imageUrl,
      rarity: body.monster.rarity || 'common',
    });

    // Add monster to user's monsters array
    user.monsters.push(newMonster._id as any);
    await user.save();

    console.log('✅ Monster added to user:', {
      viegoUID: body.viegoUID,
      monsterName: newMonster.name,
    });

    return NextResponse.json({
      success: true,
      monster: newMonster,
      message: 'Monster added successfully',
    });
  } catch (error) {
    console.error('Add Monster API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add monster',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/monsters
 * Update a monster (e.g., hatch egg, level up, feed)
 *
 * Body:
 * {
 *   "viegoUID": "viego_xxx",
 *   "monsterId": "monster_id",
 *   "updates": {
 *     "hatchProgress": 100,
 *     "type": "monster",
 *     "level": 2,
 *     "xp": 50
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (!body.viegoUID || !body.monsterId) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID and monsterId are required',
        },
        { status: 400 }
      );
    }

    // Verify user owns this monster
    const user = await User.findOne({ viegoUID: body.viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const ownsMonster = user.monsters.some(
      (id) => id.toString() === body.monsterId
    );

    if (!ownsMonster) {
      return NextResponse.json(
        {
          success: false,
          error: 'Monster not found or does not belong to user',
        },
        { status: 403 }
      );
    }

    // Update the monster
    const monster = await Monster.findById(body.monsterId);

    if (!monster) {
      return NextResponse.json(
        {
          success: false,
          error: 'Monster not found',
        },
        { status: 404 }
      );
    }

    // Apply updates
    if (body.updates) {
      Object.keys(body.updates).forEach((key) => {
        (monster as any)[key] = body.updates[key];
      });

      await monster.save();
    }

    console.log('✅ Monster updated:', {
      viegoUID: body.viegoUID,
      monsterId: body.monsterId,
    });

    return NextResponse.json({
      success: true,
      monster,
      message: 'Monster updated successfully',
    });
  } catch (error) {
    console.error('Update Monster API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update monster',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monsters?viegoUID=xxx&monsterId=xxx
 * Remove a monster from user's island
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const viegoUID = searchParams.get('viegoUID');
    const monsterId = searchParams.get('monsterId');

    if (!viegoUID || !monsterId) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID and monsterId are required',
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Remove monster from user's array
    user.monsters = user.monsters.filter(
      (id) => id.toString() !== monsterId
    ) as any;
    await user.save();

    // Delete the monster document
    await Monster.findByIdAndDelete(monsterId);

    console.log('✅ Monster removed:', { viegoUID, monsterId });

    return NextResponse.json({
      success: true,
      message: 'Monster removed successfully',
    });
  } catch (error) {
    console.error('Delete Monster API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete monster',
      },
      { status: 500 }
    );
  }
}
