import { S3 } from '@aws-sdk/client-s3'
import qrcode from 'qrcode-terminal'


export const onRequestGet = async ({env, params, next}) => {
    if (!params.key || params.key.length !== 1) {
        return next()
    }
    
    const s3 = new S3({
        credentials: {
            accessKeyId: env.ACCESS_KEY_ID,
            secretAccessKey: env.SECRET_ACCESS_KEY
        },
        endpoint: env.ENDPOINT,
        region: env.REGION
    })
    
    return s3.getObject({
        Bucket: env.BUCKET,
        Key: params.key[0]
    })
        .then(result => new Response(result.Body, {
            headers: {
                'content-disposition': result.ContentDisposition,
                'content-type': result.ContentType,
                'etag': result.ETag,
                'last-modified': result.LastModified
            }
        }))
        .catch(error => {
            switch(error.name) {
                case 'NoSuchKey':
                    return new Response('That key does not exist!' + '\n', {status: 404})
                default:
                    throw error
            }
        })
}

export const onRequestPatch = async ({request, env, params, next}) => {
    if (!params.key || params.key.length !== 2) {
        return next()
    }
    
    const s3 = new S3({
        credentials: {
            accessKeyId: env.ACCESS_KEY_ID,
            secretAccessKey: env.SECRET_ACCESS_KEY
        },
        endpoint: env.ENDPOINT,
        region: env.REGION
    })
    
    return s3.completeMultipartUpload({
        Bucket: env.BUCKET,
        Key: params.key[0],
        MultipartUpload: {
            Parts: await request.json()
        },
        UploadId: params.key[1]
    })
        .then(result => {
            let link = `https://${request.headers.get('host')}/t/${result.Key}`

            let code

            qrcode.generate(link, {small: true}, (qrcode) => {
                code = qrcode
            })

            return new Response(JSON.stringify({'code': code, 'link': link}) + '\n')
        })
        .catch(error => {
            switch(error.name) {
                case 'InvalidArgument':
                case 'InvalidPart':
                    return new Response('One or more of the specified parts could not be found.' + '\n', {status: 400})
                case 'NoSuchUpload':
                    return new Response('The specified upload does not exist.' + '\n', {status: 404})
                default:
                    throw error
            }
        })
}

export const onRequestPut = async ({request, env, params, next}) => {
    if (!params.key || params.key.length !== 3) {
        return next()
    }

    const partSize = parseInt(request.headers.get('content-length'))

    if (partSize > env.MAX_PART_SIZE) {
        return new Response(`Part size must be lower than ${env.MAX_PART_SIZE}!` + '\n', {status: 400})
    }
    
    const partNumber = parseInt(params.key[2])
    const maxPartNumber = Math.ceil(env.MAX_FILE_SIZE / env.MAX_PART_SIZE)
    
    if (isNaN(partNumber) || partNumber < 1 || partNumber > maxPartNumber) {
        return new Response(`Part number must be between 1 and ${maxPartNumber}!` + '\n', {status: 400})
    }
    
    const s3 = new S3({
        credentials: {
            accessKeyId: env.ACCESS_KEY_ID,
            secretAccessKey: env.SECRET_ACCESS_KEY
        },
        endpoint: env.ENDPOINT,
        region: env.REGION
    })
    
    return s3.uploadPart({
        Body: request.body,
        Bucket: env.BUCKET,
        Key: params.key[0],
        PartNumber: partNumber,
        UploadId: params.key[1]
    })
        .then(result => new Response(JSON.stringify({'ETag': result.ETag, 'PartNumber': partNumber}) + '\n'))
        .catch(error => {
            switch(error.name) {
                case 'NoSuchKey':
                    return new Response('That key does not exist!' + '\n', {status: 404})
                default:
                    throw error
            }
        })
}