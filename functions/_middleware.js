export async function onRequest({ request, next }) {
  console.log('Middleware: Incoming request to', request.url);
  
  const response = await next();
  return response;
}