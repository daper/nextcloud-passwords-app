#!/bin/sh

BASE_DIR=$(git rev-parse --show-toplevel)
sed -Ei 's/ compile / implementation /g' $BASE_DIR/node_modules/react-native-sqlcipher-2/android/build.gradle
sed -Ei 's/compileSdkVersion [0-9]{2}/compileSdkVersion 28/g' $BASE_DIR/node_modules/react-native-sqlcipher-2/android/build.gradle
sed -Ei 's/ compile / implementation /g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -Ei '/buildToolsVersion/d' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -Ei 's/compileSdkVersion [0-9]{2}/compileSdkVersion 28/g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -Ei 's/targetSdkVersion [0-9]{2}/targetSdkVersion 28/g' $BASE_DIR/node_modules/react-native-fingerprint-scanner/android/build.gradle
sed -Ei 's/1\.2\.71/1\.3\.0/g' $BASE_DIR/node_modules/react-native-webview/android/build.gradle