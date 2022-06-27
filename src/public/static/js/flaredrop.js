let fileProgress = 0
let fileUpload = false

function formatTransferRateString(transferRate) {
    if (transferRate < Math.pow(2, 10)) {
        return `${Math.round(transferRate * 100) / 100} B/s`
    } else if (transferRate < Math.pow(2^20)) {
        return `${Math.round((transferRate / Math.pow(2, 10)) * 100) / 100} KiB/s`
    } else {
        return `${Math.round((transferRate / Math.pow(2, 20)) * 100) / 100} MiB/s`
    }
}

function createChunks(file) {
    let cursor = 0
    let chunks = []

    if (file.size < 10 * 5242880) {
        var chunkSize = 5242880
        var chunkCount = Math.ceil(file.size / chunkSize)
    } else {
        var chunkCount = 10
        var chunkSize = Math.ceil(file.size / chunkCount)
    }

    for (let i = 1; i <= chunkCount; i++) {
        if (i == chunkCount) {
            chunks.push(file.slice(cursor, file.size))
        } else {
            chunks.push(file.slice(cursor, cursor + chunkSize))
        }
        cursor += chunkSize
    }

    return chunks
}

async function uploadChunk(client, key, uploadId, partNumber, chunk) {
    let chunkProgress = 0
    
    const response = await client({
        url: `/api/v1/transfers/${key}/${uploadId}/${partNumber}`,
        method: 'PUT',
        data: chunk,
        onUploadProgress: async function(progressEvent) {
            fileProgress += progressEvent.loaded - chunkProgress
            chunkProgress += progressEvent.loaded - chunkProgress
        },
        headers: {'content-type': 'application/octet-stream'}
    })

    return response.data
}

async function handleUpload(event) {
    event.preventDefault()

    document.getElementById('uploadButton').innerText = 'Starting...'
    document.getElementById('uploadButton').disabled = true
    document.getElementById('uploadButton').style = 'cursor: not-allowed;'

    fileProgress = 0

    const uploadForm = event.target.elements

    const file = uploadForm.file.files[0]

    if (file.size > 53687091200) {
        return alert('Max filesize is 50 GiB!')
    }

    const client = axios.create()

    var response = await client({
        method: 'POST',
        url: '/api/v1/transfers',
        data: {
            'fileName': file.name,
            'fileType': file.type
        },
        headers: {'content-type': 'application/json'}
    })

    const key = response.data['key']
    const uploadId = response.data['uploadId']

    let monitorProgress = 0

    const monitor = setInterval(function() {
        const progressDifference = fileProgress - monitorProgress
        monitorProgress += progressDifference
        if (monitorProgress === file.size) {
            clearInterval(monitor)
        }
        document.getElementById('uploadButton').innerText = `${Math.floor((monitorProgress / file.size) * 10000) / 100}% - ${formatTransferRateString(progressDifference)}`
        console.log(Math.floor((monitorProgress / file.size) * 10000) / 100)
    }, 1000)

    const promises = []

    const chunks = createChunks(file)

    for (let i = 0; i < chunks.length; i++) {
        promises.push(uploadChunk(client, key, uploadId, i + 1, chunks[i]))
    }

    const parts = await Promise.all(promises)

    var response = await client({
        method: 'PATCH',
        url: `/api/v1/transfers/${key}/${uploadId}`,
        data: parts
    })

    clearInterval(monitor)
    document.getElementById('uploadButton').disabled = false
    document.getElementById('uploadButton').style = ''
    document.getElementById('uploadButton').innerText = 'Upload'

    return alert(response.data.link)
}

document.getElementById('uploadForm').addEventListener('submit', event => handleUpload(event))
