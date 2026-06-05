import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Call Vapi API directly
    const apiKey = process.env.VAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'VAPI_API_KEY is not set' }, { status: 500 });
    }

    // Fetch assistant ID
    const asstRes = await fetch('https://api.vapi.ai/assistant', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const assistants = await asstRes.json();
    if (!assistants || assistants.length === 0) {
       return NextResponse.json({ error: 'No Vapi assistants found' }, { status: 500 });
    }
    const assistantId = assistants[0].id;

    // Fetch phone number id
    const phoneRes = await fetch('https://api.vapi.ai/phone-number', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const phones = await phoneRes.json();
    const phoneNumberId = phones.length > 0 ? phones[0].id : null;

    if (!phoneNumberId) {
      return NextResponse.json({ error: 'No Vapi phone number found' }, { status: 500 });
    }

    // Create outbound call
    const callRes = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumberId: phoneNumberId,
        assistantId: assistantId,
        customer: {
          number: phoneNumber
        }
      })
    });

    if (!callRes.ok) {
      const err = await callRes.json();
      throw new Error(err.message || 'Failed to create call');
    }

    const call = await callRes.json();
    return NextResponse.json({ success: true, call });
  } catch (error: any) {
    console.error('Outbound call error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
