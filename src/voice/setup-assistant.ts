import { VapiClient } from '@vapi-ai/server-sdk';
import { env } from '../config/env';
import { SYSTEM_PROMPT } from '../rag/prompts';

const vapi = new VapiClient({ token: env.VAPI_API_KEY });

async function setupAssistant() {
  try {
    console.log('Creating Vapi Assistant...');
    const assistant = await vapi.assistants.create({
      name: `${env.PERSONA_NAME} AI Persona`,
      model: {
        provider: 'openai', // Using Vapi's built-in models
        model: 'gpt-4o', 
        systemPrompt: SYSTEM_PROMPT,
        // Tools available to the assistant
        tools: [
          {
            type: 'function',
            function: {
              name: 'answerQuestion',
              description: 'Answers questions about Anup\'s background, skills, education, experience, and projects. Use this whenever the user asks a question about Anup.',
              parameters: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: 'The specific question the user asked.',
                  },
                },
                required: ['question'],
              },
            },
            server: { url: env.WEBHOOK_URL || 'https://your-production-url.com/api/vapi/webhook' }
          },
          {
            type: 'function',
            function: {
              name: 'checkAvailability',
              description: 'Checks Anup\'s calendar for free slots on a given date.',
              parameters: {
                type: 'object',
                properties: {
                  date: {
                    type: 'string',
                    description: 'The date to check availability in YYYY-MM-DD format (e.g., 2026-06-05).',
                  },
                },
                required: ['date'],
              },
            },
            server: { url: env.WEBHOOK_URL || 'https://your-production-url.com/api/vapi/webhook' }
          },
          {
            type: 'function',
            function: {
              name: 'bookMeeting',
              description: 'Books a meeting on Anup\'s calendar after agreeing on a time slot.',
              parameters: {
                type: 'object',
                properties: {
                  dateTime: {
                    type: 'string',
                    description: 'The agreed upon date and time for the meeting in ISO format (e.g., 2026-06-05T14:30:00+05:30).',
                  },
                  callerName: {
                    type: 'string',
                    description: 'The name of the person booking the meeting.',
                  },
                  callerEmail: {
                    type: 'string',
                    description: 'The email address of the person booking the meeting.',
                  },
                },
                required: ['dateTime', 'callerName', 'callerEmail'],
              },
            },
            server: { url: env.WEBHOOK_URL || 'https://your-production-url.com/api/vapi/webhook' }
          }
        ],
      },
      voice: {
        provider: '11labs',
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice (professional male)
      },
      firstMessage: `Hi there! I'm the AI representative for ${env.PERSONA_NAME}. How can I help you today?`,
      serverUrl: env.WEBHOOK_URL || 'https://your-production-url.com/api/vapi/webhook',
    });

    console.log(`\n✅ Assistant created successfully!`);
    console.log(`   Assistant ID: ${assistant.id}`);
    console.log(`   Name: ${env.PERSONA_NAME} AI Persona`);
    
    // List phone numbers to find the correct one
    try {
      const phoneNumbers = await vapi.phoneNumbers.list();
      if (phoneNumbers && (phoneNumbers as any[]).length > 0) {
        const phone = (phoneNumbers as any[])[0];
        console.log(`\n📞 Found phone number: ${phone.number} (ID: ${phone.id})`);
        console.log(`   Attaching assistant to phone number via API...`);
        // Use raw fetch since SDK has UUID validation issues
        const patchRes = await fetch(`https://api.vapi.ai/phone-number/${phone.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${env.VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assistantId: assistant.id }),
        });
        if (patchRes.ok) {
          console.log(`✅ Successfully attached! Your AI persona is LIVE at: ${phone.number}`);
        } else {
          const err = await patchRes.json();
          console.log(`⚠️  Attach failed: ${JSON.stringify(err)}`);
          console.log(`   Manually set assistant ID "${assistant.id}" in the Vapi dashboard.`);
        }
      } else {
        console.log(`\n⚠️  No phone numbers found on this Vapi account.`);
        console.log(`   Go to https://dashboard.vapi.ai/phone-numbers to buy one, then:`);
        console.log(`   Set VAPI_PHONE_NUMBER_ID=${assistant.id} in .env and re-run.`);
      }
    } catch (phoneErr: any) {
      console.log(`\n⚠️  Could not auto-attach to phone: ${phoneErr.message}`);
      console.log(`   Manually attach assistant ID "${assistant.id}" in the Vapi dashboard.`);
    }

  } catch (error) {
    console.error('Error setting up assistant:', error);
  }
}

// Allow running this script directly
if (require.main === module) {
  setupAssistant();
}
