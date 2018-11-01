#!/bin/bash

sed -i 's/ compile / implementation /g' node_modules/react-native-sqlcipher-2/android/build.gradle
sed -i 's/compileSdkVersion 23/compileSdkVersion 27/g' node_modules/react-native-sqlcipher-2/android/build.gradle