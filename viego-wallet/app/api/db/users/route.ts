import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10) || 50,
      200
    );

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        viegoUID: user.viegoUID,
        visaUserIdentifier: user.visaUserIdentifier,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        accountStatus: user.accountStatus,
        preferences: user.preferences,
        visaAlertDocumentId: user.visaAlertDocumentId,
        alertPreferences: user.alertPreferences,
        defaultAlertsPreferences: user.defaultAlertsPreferences,
        xp: user.xp,
        schoolName: user.schoolName,
        friendCount: user.friends?.length || 0,
        badgeCount: user.badges?.length || 0,
        monsterCount: user.monsters?.length || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to list users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users',
      },
      { status: 500 }
    );
  }
}
