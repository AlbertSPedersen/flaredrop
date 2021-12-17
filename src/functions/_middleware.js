export const onRequest = async ({request, env, next}) => {
    const host = request.headers.get('host')
    
    if (env.HOST && !(new RegExp(env.HOST)).test(host)) {
        return new Response('404 Not Found' + '\n', {status: 404})
    }

    try {
        return await next()
    } catch (error) {
        return new Response(error + '\n', {status: 500, statusText: 'Albert Wrote Bad Code'})
    }
}
