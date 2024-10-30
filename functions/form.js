export function onRequest(context) {
    return new Response("Hello, world!")
}

export function onRequestPost(context) {
    return new Response("Hello, Post!")
}

export function onRequestPut(context) {
    return new Response("Hello, Put!")
}

export function onRequestDelete(context) {
    return new Response("Hello, Delete!")
}