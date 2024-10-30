export function onRequest() {
  return new Response('Test endpoint working!', {
    headers: { 'Content-Type': 'text/plain' },
  });
} 