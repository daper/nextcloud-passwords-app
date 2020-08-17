#!/usr/bin/env bash

echo "${SIGNING_KEY}" \
| base64 -d > android/app/my-release-key.keystore

cat <<-EOF >> android/gradle.properties
	MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
	MYAPP_RELEASE_KEY_ALIAS=${ALIAS}
	MYAPP_RELEASE_STORE_PASSWORD=${KEY_STORE_PASSWORD}
	MYAPP_RELEASE_KEY_PASSWORD=${KEY_PASSWORD}
EOF