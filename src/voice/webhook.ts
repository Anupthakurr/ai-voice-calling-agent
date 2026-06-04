import { Router, Request, Response } from 'express';
import { generateResponse } from '../rag/generator';
import { getAvailableSlots, createEvent } from '../calendar/client';

export const webhookRouter = Router();

webhookRouter.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    // Handle Function Calls from Vapi
    if (message && message.type === 'function-call') {
      const { functionCall } = message;

      console.log(`[Webhook] Function called: ${functionCall.name}`);

      switch (functionCall.name) {
        case 'answerQuestion': {
          const { question } = functionCall.parameters;
          const answer = await generateResponse(question);
          res.json({
            results: [{
              toolCallId: functionCall.id,
              result: answer,
            }]
          });
          return;
        }

        case 'checkAvailability': {
          const { date } = functionCall.parameters;
          const today = new Date().toISOString().split('T')[0];
          const queryDate = date || today;
          
          const slots = await getAvailableSlots(queryDate);
          
          if (slots.length === 0) {
            res.json({
              results: [{
                toolCallId: functionCall.id,
                result: `No available slots on ${queryDate}. Please suggest another day.`,
              }]
            });
          } else {
            // Return top 3 slots to not overwhelm the voice agent
            const availableTimes = slots.slice(0, 3).map(s => {
              const d = new Date(s.start);
              return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
            });
            res.json({
              results: [{
                toolCallId: functionCall.id,
                result: `I found available slots on ${queryDate} at ${availableTimes.join(', ')} IST. Do any of these work for you?`,
              }]
            });
          }
          return;
        }

        case 'bookMeeting': {
          const { dateTime, callerName, callerEmail } = functionCall.parameters;
          const start = new Date(dateTime);
          const end = new Date(start.getTime() + 30 * 60000); // 30 min meeting

          await createEvent(
            `Interview with ${callerName}`,
            start.toISOString(),
            end.toISOString(),
            callerEmail,
            callerName
          );

          res.json({
            results: [{
              toolCallId: functionCall.id,
              result: `Perfect, I've booked the meeting for you at ${start.toLocaleString()}. You should receive a calendar invite shortly.`,
            }]
          });
          return;
        }

        default:
          console.warn(`[Webhook] Unknown function: ${functionCall.name}`);
          res.status(400).json({ error: 'Function not found' });
          return;
      }
    }

    // Handle end of call report
    if (message && message.type === 'end-of-call-report') {
      console.log(`[Webhook] Call ended. Duration: ${message.endedReason}`);
      // Here we would save metrics for eval report
      res.status(200).send('OK');
      return;
    }

    // Acknowledge other event types (status updates, transcript)
    res.status(200).send('OK');

  } catch (error) {
    console.error('[Webhook Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
