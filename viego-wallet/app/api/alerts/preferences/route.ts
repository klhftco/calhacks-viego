import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { AlertPreference } from '@/types/visaAlerts';
import {
  addTailoredAlertPreferencesRemote,
  isVisaAlertsProxyEnabled,
  removeAlertPreferencesRemote,
  replaceAlertPreferencesRemote,
} from '@/lib/visaAlerts';

const shouldProxyToVisa = isVisaAlertsProxyEnabled();

function sanitizePreferences(raw: any): AlertPreference[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((pref) => pref && typeof pref === 'object')
    .map((pref) => ({
      alertType: pref.alertType,
      controlType: pref.controlType,
      status: pref.status,
      portfolioID: pref.portfolioID,
      contacts: Array.isArray(pref.contacts)
        ? pref.contacts.map((contact: any) => ({
            contactType: contact.contactType,
            contactValue: contact.contactValue,
            callingCode: contact.callingCode,
            isVerified: contact.isVerified,
            preferredEmailFormat: contact.preferredEmailFormat,
            status: contact.status,
          }))
        : [],
    }));
}

function preferenceSignature(pref: AlertPreference) {
  const contact = pref.contacts?.[0];
  return [
    pref.alertType || '',
    pref.controlType || '',
    contact?.contactType || '',
    contact?.contactValue || '',
  ].join('::');
}

export async function GET(request: NextRequest) {
  const viegoUID = request.nextUrl.searchParams.get('viegoUID');

  if (!viegoUID) {
    return NextResponse.json(
      { success: false, error: 'viegoUID query parameter is required' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await (User as any).findOne({ viegoUID }).lean();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Account not found' },
      { status: 404 }
    );
  }

  const userDoc = user as any;
  return NextResponse.json({
    success: true,
    data: {
      visaUserIdentifier: userDoc.visaUserIdentifier,
      visaAlertDocumentId: userDoc.visaAlertDocumentId,
      alertPreferences: userDoc.alertPreferences || [],
      defaultAlertsPreferences: userDoc.defaultAlertsPreferences || [],
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action = 'replace', viegoUID, documentId, userIdentifier } = body;

  if (!viegoUID) {
    return NextResponse.json(
      { success: false, error: 'viegoUID is required' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const user = await (User as any).findOne({ viegoUID });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Account not found' },
      { status: 404 }
    );
  }

  const sanitizedPreferences = sanitizePreferences(body.alertPreferences);
  const hasDefaultPrefPayload = Array.isArray(body.defaultAlertsPreferences);
  const sanitizedDefaults = sanitizePreferences(
    hasDefaultPrefPayload ? body.defaultAlertsPreferences : []
  ).flatMap((pref) => pref.contacts);

  if (documentId) {
    user.visaAlertDocumentId = documentId;
  }

  if (userIdentifier) {
    if (user.visaUserIdentifier && user.visaUserIdentifier !== userIdentifier) {
      return NextResponse.json(
        {
          success: false,
          error: 'visaUserIdentifier already set and cannot be mutated for this account',
        },
        { status: 409 }
      );
    }
    if (!user.visaUserIdentifier) {
      user.visaUserIdentifier = userIdentifier;
    }
  }

  let updatedPreferences = user.alertPreferences || [];

  switch (action) {
    case 'replace':
      updatedPreferences = sanitizedPreferences;
      break;
    case 'add':
      if (!sanitizedPreferences.length) {
        return NextResponse.json(
          { success: false, error: 'alertPreferences array is required for add action' },
          { status: 400 }
        );
      }
      updatedPreferences = [...updatedPreferences, ...sanitizedPreferences];
      break;
    case 'remove': {
      if (!sanitizedPreferences.length) {
        return NextResponse.json(
          { success: false, error: 'alertPreferences array is required for remove action' },
          { status: 400 }
        );
      }
      const signaturesToRemove = new Set(sanitizedPreferences.map(preferenceSignature));
      updatedPreferences = updatedPreferences.filter(
        (pref: any) => !signaturesToRemove.has(preferenceSignature(pref as AlertPreference))
      );
      break;
    }
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use replace, add, or remove.' },
        { status: 400 }
      );
  }

  user.alertPreferences = updatedPreferences;

  if (hasDefaultPrefPayload) {
    user.defaultAlertsPreferences = sanitizedDefaults;
  }

  await user.save();

  let visaResponse: Record<string, any> | null = null;
  let visaError: string | null = null;

  if (shouldProxyToVisa && documentId && userIdentifier && sanitizedPreferences.length) {
    try {
      if (action === 'replace') {
        visaResponse = await replaceAlertPreferencesRemote({
          documentId,
          userIdentifier,
          alertPreferences: sanitizedPreferences,
        });
      } else if (action === 'add') {
        visaResponse = await addTailoredAlertPreferencesRemote({
          documentId,
          userIdentifier,
          alertPreferences: sanitizedPreferences,
        });
      } else if (action === 'remove') {
        visaResponse = await removeAlertPreferencesRemote({
          documentId,
          userIdentifier,
          alertPreferences: sanitizedPreferences,
        });
      }
    } catch (error) {
      visaError = error instanceof Error ? error.message : 'Visa API call failed';
      console.error('Visa alert preferences sync failed:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      visaUserIdentifier: user.visaUserIdentifier,
      visaAlertDocumentId: user.visaAlertDocumentId,
      alertPreferences: user.alertPreferences,
      defaultAlertsPreferences: user.defaultAlertsPreferences || [],
    },
    visaResponse,
    visaError,
    source: visaResponse ? 'visa' : 'local',
  });
}
