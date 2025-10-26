"use client";

import { useState } from "react";

type Json = any;

export default function VdpVctcTestPage() {
  const [userIdentifier, setUserIdentifier] = useState("demo-user-001");
  const [email, setEmail] = useState("demo+alerts@example.com");
  const [pan, setPan] = useState("4514170000000001");
  const [expiry, setExpiry] = useState("12/2027");
  const [ruleAmount, setRuleAmount] = useState(20);
  const [documentId, setDocumentId] = useState("");
  const [decisionAmount, setDecisionAmount] = useState(25);
  const [currency, setCurrency] = useState("USD");
  const [logs, setLogs] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<Json | null>(null);
  const [busy, setBusy] = useState(false);

  // Test endpoint state
  const [testEndpoint, setTestEndpoint] = useState("/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry");
  const [testMethod, setTestMethod] = useState("POST");
  const [testBody, setTestBody] = useState('{\n  "primaryAccountNumber": "4514170000000001"\n}');

  // Available controls state
  const [availableMerchantControls, setAvailableMerchantControls] = useState<string[]>([]);
  const [availableTransactionControls, setAvailableTransactionControls] = useState<string[]>([]);
  const [selectedControlType, setSelectedControlType] = useState<string>("");

  function log(msg: string) {
    setLogs((l) => [msg, ...l].slice(0, 200));
  }

  async function callApi(path: string, init?: RequestInit) {
    const res = await fetch(path, {
      method: init?.method || "POST",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  }

  const doCheckAvailableControls = async () => {
    setBusy(true);
    try {
      log("Checking available controls for card...");
      const res = await fetch(`/api/vctc/available-controls?pan=${encodeURIComponent(pan)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setLastResult(data);

      // Extract available control types
      const merchantTypes = data.merchantControls?.resource?.merchantControls?.map((c: any) => c.name) || [];
      const transactionTypes = data.transactionControls?.resource?.transactionControls?.map((c: any) => c.name) || [];

      setAvailableMerchantControls(merchantTypes);
      setAvailableTransactionControls(transactionTypes);

      // Auto-select first available merchant control
      if (merchantTypes.length > 0 && !selectedControlType) {
        setSelectedControlType(merchantTypes[0]);
      }

      log(`✔ Found ${merchantTypes.length} merchant controls, ${transactionTypes.length} transaction controls`);
    } catch (e: any) {
      log(`✖ Available controls error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doCheckProfile = async () => {
    setBusy(true);
    try {
      log(`Checking if profile exists for ${userIdentifier}...`);
      const res = await fetch(`/api/vctc/customer-profile/${encodeURIComponent(userIdentifier)}`);
      const data = await res.json();
      if (res.ok) {
        setLastResult(data);
        log(`✔ Profile exists for ${userIdentifier}`);
      } else if (res.status === 404) {
        log(`ℹ Profile does NOT exist for ${userIdentifier}`);
        setLastResult(data);
      } else {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      log(`✖ Check profile error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doCreateProfile = async () => {
    setBusy(true);
    try {
      log("Creating customer profile...");
      const body = {
        userIdentifier,
        firstName: "Demo",
        lastName: "User",
        preferredLanguage: "en-us",
        countryCode: "USA",
        defaultAlertsPreferences: [
          {
            contactType: "Email",
            contactValue: email,
            preferredEmailFormat: "Html",
            status: "Active",
          },
        ],
      };
      const res = await callApi("/api/vctc/customer-profile", {
        body: JSON.stringify(body),
      });
      setLastResult(res);
      log("✔ Profile created");
    } catch (e: any) {
      log(`✖ Profile error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doEnrollCard = async () => {
    setBusy(true);
    try {
      log("Enrolling card...");
      const res = await callApi("/api/vctc/enroll-card", {
        body: JSON.stringify({
          primaryAccountNumber: pan,
          userIdentifier,
        }),
      });
      setLastResult(res);
      const doc = res?.result?.resource?.documentID || res?.result?.documentID;
      if (doc) {
        setDocumentId(doc);
        log(`✔ Card enrolled. documentId=${doc}`);
      } else {
        log("✔ Card enrolled (no documentId in response)");
      }
    } catch (e: any) {
      log(`✖ Enroll error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doAddRule = async () => {
    setBusy(true);
    try {
      const docId = documentId.trim();
      if (!docId) throw new Error("documentId is empty; enroll first");
      if (!selectedControlType) throw new Error("No control type selected; check available controls first");

      log(`Adding/updating rule for ${selectedControlType}...`);
      // Merchant control with required controlType field
      const rules = {
        merchantControls: [
          {
            controlType: selectedControlType, // REQUIRED: Must be available MCT_ value
            isControlEnabled: true, // REQUIRED
            shouldDeclineAll: false,
            alertThreshold: ruleAmount,
            declineThreshold: ruleAmount * 1.1,
            userIdentifier,
          },
        ],
      };
      const res = await callApi("/api/vctc/rules", {
        body: JSON.stringify({ documentId: docId, rules }),
      });
      setLastResult(res);
      log(`✔ Rule added/updated for ${selectedControlType}`);
    } catch (e: any) {
      log(`✖ Rule error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doDecision = async () => {
    setBusy(true);
    try {
      log("Requesting authorization decision...");
      const res = await callApi("/api/vctc/decision", {
        body: JSON.stringify({
          primaryAccountNumber: pan,
          amount: Number(decisionAmount),
          merchantName: "Test E-Commerce Merchant",
          merchantCategoryCode: "5999",
        }),
      });
      setLastResult(res);
      log("✔ Decision received");
    } catch (e: any) {
      log(`✖ Decision error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doAlerts = async () => {
    setBusy(true);
    try {
      log("Fetching alerts for user...");
      const res = await fetch(`/api/vctc/alerts?userIdentifier=${encodeURIComponent(userIdentifier)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setLastResult(data);
      log("✔ Alerts fetched");
    } catch (e: any) {
      log(`✖ Alerts error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doRunAll = async () => {
    setBusy(true);
    setLogs([]);
    try {
      // Complete workflow: profile -> enroll -> rule -> decision -> alerts
      log("Starting full VCTC workflow...");
      await doCreateProfile();
      await doEnrollCard();
      // Wait a moment for documentId to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      await doAddRule();
      await doDecision();
      await doAlerts();
      log("✔ Full flow completed");
    } catch (e: any) {
      log(`✖ Flow error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doTestEndpoint = async () => {
    setBusy(true);
    try {
      log(`Testing ${testMethod} ${testEndpoint}...`);

      let url = `/api/vctc/test?endpoint=${encodeURIComponent(testEndpoint)}&method=${testMethod}`;

      const options: RequestInit = {
        method: testMethod === 'GET' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      if (testMethod !== 'GET' && testBody.trim()) {
        try {
          options.body = testBody;
        } catch (e) {
          log(`✖ Invalid JSON in body: ${e}`);
          return;
        }
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setLastResult(data);

      if (data.success) {
        log(`✔ Test succeeded (${data.response.statusCode})`);
      } else {
        log(`✖ Test failed (${data.response?.statusCode || 'unknown'}): ${data.error || JSON.stringify(data.response?.body)}`);
      }
    } catch (e: any) {
      log(`✖ Test error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Visa VDP VCTC Sandbox — Test Flow</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">User Identifier</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Alert Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-medium">Card PAN (sandbox)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Expiry (MM/YYYY)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Rule Amount (USD)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={ruleAmount}
                onChange={(e) => setRuleAmount(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Decision Amount</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={decisionAmount}
                onChange={(e) => setDecisionAmount(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Currency</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Control Type</label>
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded px-3 py-2"
                value={selectedControlType}
                onChange={(e) => setSelectedControlType(e.target.value)}
                disabled={availableMerchantControls.length === 0}
              >
                <option value="">Select a control type...</option>
                {availableMerchantControls.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
              <button
                onClick={doCheckAvailableControls}
                disabled={busy}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Check Available
              </button>
            </div>
            {availableMerchantControls.length > 0 && (
              <div className="text-xs text-gray-600">
                {availableMerchantControls.length} merchant controls available for this card
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={doCheckProfile} disabled={busy} className="px-3 py-2 bg-gray-600 text-white rounded">Check Profile</button>
            <button onClick={doCreateProfile} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Create Profile</button>
            <button onClick={doEnrollCard} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Enroll Card</button>
            <button onClick={doAddRule} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Add Rule</button>
            <button onClick={doDecision} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Decision</button>
            <button onClick={doAlerts} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Alerts</button>
            <button onClick={doRunAll} disabled={busy} className="px-3 py-2 bg-green-600 text-white rounded">Run Full Flow</button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">documentId</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Returned by Enroll"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-medium mb-2">Logs</h2>
            <div className="h-48 overflow-auto border rounded p-2 bg-gray-50 text-sm">
              {logs.length === 0 ? <div className="text-gray-400">No logs yet</div> : logs.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-medium mb-2">Last Result</h2>
            <pre className="h-80 overflow-auto border rounded p-3 bg-gray-50 text-xs">
{JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Notes: All calls run server-side with mTLS and Basic Auth. Do not use real PANs.
      </div>

      {/* Test Endpoint Section */}
      <div className="border-t pt-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Any Endpoint</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test any Visa API endpoint directly using your SSL certificates. Great for exploring undocumented endpoints!
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Method</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium mb-1">Endpoint Path</label>
              <input
                className="w-full border rounded px-3 py-2 font-mono text-sm"
                placeholder="/vctc/customerrules/v1/..."
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Request Body (JSON)</label>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={6}
              placeholder='{"primaryAccountNumber": "4514170000000001"}'
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
            />
          </div>

          <button
            onClick={doTestEndpoint}
            disabled={busy}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Endpoint
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Examples to try:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code>/vctc/customerrules/v1/consumertransactioncontrols/inquiries/cardinquiry</code> (POST with PAN)</li>
              <li><code>/vctc/customerrules/v1/consumertransactioncontrols/{"{"}"documentID{"}"}</code> (GET rules)</li>
              <li><code>/vctc/validation/v1/decisions/{"{"}"decisionID{"}"}</code> (GET decision details)</li>
              <li><code>/vdp/helloworld</code> (GET - test connectivity)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
