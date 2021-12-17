const template = String.raw`#!/bin/sh

if ! command -V stat > /dev/null || ! command -V curl > /dev/null || ! command -V basename > /dev/null || ! command -V file > /dev/null || ! command -V cat > /dev/null || ! command -V parallel > /dev/null || ! command -V jq > /dev/null
then
    exit 1
fi

if [ ! -f "$1" ]
then
    echo "Usage: $0 <file>"
    exit 1
fi

file_size=$(stat --printf="%s" "$1")
file_name=$(basename "$1")  
file_type=$(file -b --mime-type "$1")

if [ "$file_size" -gt {{MAX_FILE_SIZE}} ]
then
    echo "That file is too big!"
    exit 1
fi

printf "%b" "-----------------------------------------------------------------\n"
printf "%b" "FlareDrop - https://github.com/AlbertSPedersen/flaredrop\n\n"
printf "%b" "Special thanks to the authors of:\n"
printf "%b" " - aws-sdk-js-v3\n"
printf "%b" " - base64-arraybuffer\n"
printf "%b" " - qrcode-terminal\n\n"
printf "%b" "Copyright (c) 2021 Albert Søndergård Pedersen. Licensed under the MIT license.\n"
printf "%b" "-----------------------------------------------------------------\n\n"

printf "Starting upload...\n\n"

data=$(jq \
    --null-input \
    --arg fileName "$file_name" \
    --arg fileType "$file_type" \
    '{"fileName":$fileName,"fileType":$fileType}'
)

res=$(curl -s -X POST -d "$data" -H 'content-type: application/json' 'https://{{HOST}}/api/v1/transfers')

key=$(echo "$res" | jq -r '.key')

upload_id=$(echo "$res" | jq -r '.uploadId')

parts=$(parallel -a "$1" --bar --eta --block {{MAX_PART_SIZE}} --jobs 16 --keep-order --pipepart --recend '' curl -s -T - "https://{{HOST}}/api/v1/transfers/$key/$upload_id/{#}")

printf "\nFinishing upload...\n\n"

data=$(echo "$parts" | jq -s '.')

res=$(curl -s -X PATCH -d "$data" -H 'content-type: application/json' "https://{{HOST}}/api/v1/transfers/$key/$upload_id")

jq -r '.code' <<E
$res
E

jq -r '.link' <<E
$res
E

printf "%b" "\n"
`

export const onRequestGet = async ({request, env}) => {
    let script = template

    script = script.replace(/{{HOST}}/g, request.headers.get('host'))
    script = script.replace(/{{MAX_FILE_SIZE}}/g, env.MAX_FILE_SIZE)
    script = script.replace(/{{MAX_PART_SIZE}}/g, env.MAX_PART_SIZE)
    
    return new Response(script)
}
