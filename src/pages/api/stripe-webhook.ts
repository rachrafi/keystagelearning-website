import type { APIRoute } from 'astro';
import { verifyWebhook, handleWebhook } from '../../lib/billing';
export const prerender = false;

// Stripe calls this address when someone pays, renews, changes plan or cancels.
// Messages without a valid Stripe signature are refused.
export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const event = await verifyWebhook(payload, request.headers.get('stripe-signature'));
  if (!event) return new Response('Bad signature', { status: 400 });
  try {
    await handleWebhook(event);
  } catch (e) {
    console.error('stripe webhook failed', event.type, (e as Error).message);
    return new Response('Error', { status: 500 }); // Stripe will try again
  }
  return new Response('ok');
};
