#!/bin/sh

export DOCKER_BUILDKIT=1

BASE_DIR=$(git rev-parse --show-toplevel)
echo "[i] NextcloudPasswords found: $BASE_DIR"

IMAGE_NAME=registry.daper.io/f-droid

if [ -z "$(which docker)" ]; then
	echo "[!] docker"
	exit
fi

if [ -z "$(docker images -q $IMAGE_NAME)" ]; then
	echo "[i] Building $IMAGE_NAME... "
	docker build -t $IMAGE_NAME -f $BASE_DIR/tools/f-droid.Dockerfile $BASE_DIR/tools
	[ "$?" -ne 0 ] && exit || echo "[i] Build f-droid image OK"
fi

echo "[i] Linting f-droid app... "
docker run --rm \
  -v $BASE_DIR/tools/f-droid-builds:/repo/unsigned \
  -v $BASE_DIR/tools/com.nextcloudpasswords.yml:/repo/metadata/com.nextcloudpasswords.yml \
  $IMAGE_NAME lint com.nextcloudpasswords
[ "$?" -ne 0 ] && exit || echo "[i] f-droid lint OK"

echo "[i] Building f-droid app... "
docker run --rm \
	-v $BASE_DIR/tools/f-droid-builds:/repo/unsigned \
	-v $BASE_DIR/tools/com.nextcloudpasswords.yml:/repo/metadata/com.nextcloudpasswords.yml \
	$IMAGE_NAME build com.nextcloudpasswords:16
[ "$?" -ne 0 ] && exit || echo "[i] f-droid build OK"

[ -n "$(which tree)" ] && tree -h --noreport $BASE_DIR/tools/f-droid-builds