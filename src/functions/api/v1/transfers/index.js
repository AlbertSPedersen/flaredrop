import { S3 } from '@aws-sdk/client-s3'
import { encode } from 'base64-arraybuffer'


export const onRequestPost = async ({request, env}) => {
    const data = await request.json()
    
    const s3 = new S3({
        credentials: {
            accessKeyId: env.ACCESS_KEY_ID,
            secretAccessKey: env.SECRET_ACCESS_KEY
        },
        endpoint: env.ENDPOINT,
        region: env.REGION
    })
    
    return s3.createMultipartUpload({
        Bucket: env.BUCKET,
        ContentDisposition: `attachment; filename="${data.fileName}"`,
        ContentType: data.fileType,
        Key: encode(crypto.getRandomValues(new Uint8Array(6))).replace(/\+/g, '-').replace(/\//g, '_')
    })
        .then(result => new Response(JSON.stringify({'key': result.Key, 'uploadId': result.UploadId}) + '\n'))
}
