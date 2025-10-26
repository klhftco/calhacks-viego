/**
 * Account Management API Route
 * Handles customer profile creation, retrieval, and verification
 * Now integrated with MongoDB for persistent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createCustomerProfile } from '@/lib/visaClient';

function generateViegoUID(): string {
  return `viego_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * GET /api/account?viegoUID=xxx
 * Retrieve an existing customer profile from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const viegoUID = searchParams.get('viegoUID') || searchParams.get('userIdentifier');
    const email = searchParams.get('email');

    if (!viegoUID && !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID or email is required',
        },
        { status: 400 }
      );
    }

    let user: any;

    if (viegoUID) {
      // Retrieve by Viego UID
      user = await (User as any).findOne({ viegoUID })
        .lean();
    } else if (email) {
      // Find by email
      user = await (User as any).findOne({ email: email.toLowerCase() })
        .lean();
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object and format dates
    const userDoc = user as any;
    const profile = {
      viegoUID: userDoc.viegoUID,
      visaUserIdentifier: userDoc.visaUserIdentifier,
      email: userDoc.email,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      phoneNumber: userDoc.phoneNumber,
      xp: userDoc.xp,
      schoolName: userDoc.schoolName,
      accountStatus: userDoc.accountStatus,
      preferences: userDoc.preferences,
      friends: userDoc.friends,
      badges: userDoc.badges,
      monsters: userDoc.monsters,
      alertPreferences: userDoc.alertPreferences,
      defaultAlertsPreferences: userDoc.defaultAlertsPreferences,
      visaAlertDocumentId: userDoc.visaAlertDocumentId,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };

    return NextResponse.json({
      success: true,
      profile,
      notifications: [], // TODO: Add notifications when needed
    });
  } catch (error) {
    console.error('Account Retrieval API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve account',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/account
 * Create a new customer profile in MongoDB
 *
 * Body:
 * {
 *   "email": "student@berkeley.edu",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phoneNumber": "+1234567890" (optional),
 *   "schoolName": "UC Berkeley" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: 'email, firstName, and lastName are required',
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await (User as any).findOne({ email: body.email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this email already exists',
          code: 'ACCOUNT_EXISTS',
        },
        { status: 409 }
      );
    }

    // Use custom viegoUID if provided, otherwise generate one
    let viegoUID: string;
    if (body.customViegoUID && body.customViegoUID.trim()) {
      viegoUID = body.customViegoUID.trim();

      // Check if custom viegoUID is already taken
      const existingUID = await (User as any).findOne({ viegoUID });
      if (existingUID) {
        return NextResponse.json(
          {
            success: false,
            error: 'This Viego UID is already taken. Please choose another one.',
            code: 'VIEGOID_EXISTS',
          },
          { status: 409 }
        );
      }
    } else {
      // Generate random viegoUID
      viegoUID = generateViegoUID();
    }

    // Create customer profile in Visa API to get visaUserIdentifier
    console.log('📤 Creating Visa customer profile...');
    const visaProfile = await createCustomerProfile({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
    });

    const visaUserIdentifier = visaProfile.visaUserIdentifier;
    console.log('✅ Visa profile created:', { visaUserIdentifier });

    const newUser = await (User as any).create({
      viegoUID,
      visaUserIdentifier,
      email: body.email.toLowerCase(),
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      schoolName: body.schoolName,
      xp: 0,
      accountStatus: 'active',
      preferences: {
        notifications: true,
        budgetAlerts: true,
      },
      friends: [],
      badges: [],
      monsters: [],
    });

    const profile = {
      viegoUID: newUser.viegoUID,
      visaUserIdentifier: newUser.visaUserIdentifier,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      xp: newUser.xp,
      schoolName: newUser.schoolName,
      accountStatus: newUser.accountStatus,
      preferences: newUser.preferences,
      friends: newUser.friends,
      badges: newUser.badges,
      monsters: newUser.monsters,
      alertPreferences: newUser.alertPreferences,
      defaultAlertsPreferences: newUser.defaultAlertsPreferences,
      visaAlertDocumentId: newUser.visaAlertDocumentId,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    console.log('✅ MongoDB account created:', {
      viegoUID,
      visaUserIdentifier: newUser.visaUserIdentifier,
      email: body.email,
    });

    return NextResponse.json({
      success: true,
      profile,
      isNew: true,
      message: 'Account created successfully with Visa Customer Profile',
    });
  } catch (error: any) {
    console.error('Account Creation API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/account
 * Update an existing customer profile in MongoDB
 */
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (!body.viegoUID) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID is required for updates',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findOne({ viegoUID: body.viegoUID });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      );
    }

    // Update allowed fields only
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'schoolName', 'preferences', 'accountStatus'];

    if (body.updates) {
      Object.keys(body.updates).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          (user as any)[key] = body.updates[key];
        }
      });
    }

    await user.save();

    const updatedProfile = {
      viegoUID: user.viegoUID,
      visaUserIdentifier: user.visaUserIdentifier,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      xp: user.xp,
      schoolName: user.schoolName,
      accountStatus: user.accountStatus,
      preferences: user.preferences,
      friends: user.friends,
      badges: user.badges,
      monsters: user.monsters,
      alertPreferences: user.alertPreferences,
      defaultAlertsPreferences: user.defaultAlertsPreferences,
      visaAlertDocumentId: user.visaAlertDocumentId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log('✅ MongoDB account updated:', { viegoUID: body.viegoUID });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Account Update API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update account',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account?viegoUID=xxx
 * Delete/deactivate a customer profile in MongoDB
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const viegoUID = searchParams.get('viegoUID') || searchParams.get('userIdentifier');

    if (!viegoUID) {
      return NextResponse.json(
        {
          success: false,
          error: 'viegoUID is required',
        },
        { status: 400 }
      );
    }

    const deletedUser = await (User as any).findOneAndDelete({ viegoUID });

    if (!deletedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      );
    }

    console.log('✅ MongoDB account deleted:', { viegoUID });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account Deletion API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete account',
      },
      { status: 500 }
    );
  }
}
