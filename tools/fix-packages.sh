#!/bin/sh

BASE_DIR=$(git rev-parse --show-toplevel)
sed -i 's/ compile / implementation /g' $BASE_DIR/node_modules/react-native-sqlcipher-2/android/build.gradle
sed -i 's/compileSdkVersion 23/compileSdkVersion 27/g' $BASE_DIR/node_modules/react-native-sqlcipher-2/android/build.gradle
sed -i 's/ compile / implementation /g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -i '/buildToolsVersion/d' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -i 's/compileSdkVersion 25/compileSdkVersion 27/g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -i 's/targetSdkVersion 25/targetSdkVersion 27/g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -i 's/1\.2\.71/1\.3\.0/g' $BASE_DIR/node_modules/react-native-webview/android/build.gradle