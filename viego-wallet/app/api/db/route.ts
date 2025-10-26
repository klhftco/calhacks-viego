import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

function mapReadyState(state: number) {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const readyState = mongoose.connection.readyState;
    const [userCount, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: 'active' }),
    ]);

    const sampleUsers = await User.find()
      .select('viegoUID email accountStatus friends createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const friendEdges = sampleUsers.reduce((sum, user) => sum + (user.friends?.length || 0), 0);

    return NextResponse.json({
      success: true,
      status: {
        readyState,
        label: mapReadyState(readyState),
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      stats: {
        userCount,
        activeUsers,
        sampleFriendEdges: friendEdges,
      },
      sampleUsers: sampleUsers.map((user) => ({
        viegoUID: user.viegoUID,
        email: user.email,
        accountStatus: user.accountStatus,
        friendCount: user.friends?.length || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to inspect database',
      },
      { status: 500 }
    );
  }
}
