# FlareDrop
File-transfer/file-sharing service built on Cloudflare Workers and Pages.

## Environmental variables
* `ACCESS_KEY_ID` \
The S3 access key used for request signing. Example: `AKIAIOSFODNN7EXAMPLE`.

* `SECRET_ACCESS_KEY` \
The S3 secret key used for request signing. Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.

* `BUCKET` \
The name of the S3 bucket that files should be stored in. Example: `flaredrop`.

* `ENDPOINT` \
The endpoint used to access the S3 bucket. Example: `https://s3.eu-central-1.amazonaws.com`.

* `REGION` \
The region of the S3 bucket used for request signing.. Example: `eu-central-1`.

* `MAX_FILE_SIZE` \
The max size of a file that a user is allowed to upload. Example: `53687091200` (50 GiB).

* `MAX_PART_SIZE`\* \
The size of the parts that a file is split into when uploading. Example: `26214400` (25 MiB).

* `HOST` \
Optional host header validation regex string. Example: `(?:^flaredrop\.net$|flaredrop\.pages\.dev$)`.

\* To conform to S3 limits, this must not be less than `5242880` (5 MiB) and `MAX_FILE_SIZE` divided by `MAX_PART_SIZE` must not be more than `10000`. Additionally, Cloudflare imposes a body size limit of `104857600` (100 MiB) for Free and Pro zones, `209715200` (200 MiB) for Business zones and `524288000` (500 MiB) for Enterprise zones. 

## Credits
Special thanks to the authors of:
- [aws-sdk-js-v3](https://github.com/aws/aws-sdk-js-v3)
- [base64-arraybuffer](https://github.com/niklasvh/base64-arraybuffer)
- [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)

## License
Copyright (c) 2021 Albert Søndergård Pedersen. Licensed under the MIT license.
