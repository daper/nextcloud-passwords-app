FROM registry.gitlab.com/fdroid/docker-executable-fdroidserver:latest

ENV PATH=/fdroidserver:$ANDROID_HOME/tools/bin:$PATH ANDROID_NDK=/opt/android-ndk-r19c

RUN apt update \
	&& apt install -y gcc g++ make python \
	&& curl -Lo node.tar.xz https://nodejs.org/dist/v10.15.0/node-v10.15.0-linux-x64.tar.xz \
    && echo "4ee8503c1133797777880ebf75dcf6ae3f9b894c66fd2d5da507e407064c13b5 node.tar.xz" | sha256sum -c - \
    && tar xJf node.tar.xz \
    && cp -r node-v10.15.0-linux-x64/. /usr/local/ \
    && rm -rf node.tar.xz node-v10.15.0-linux-x64 \
    && yes | sdkmanager "build-tools;28.0.3" "platforms;android-28" \
    && yes | android update sdk --no-ui --filter platform-tools,tools,build-tools-28.0.3,android-28 \
    && wget "https://dl.google.com/android/repository/android-ndk-r19c-linux-x86_64.zip" -O /opt/ndk.zip \
    && echo "fd94d0be6017c6acbd193eb95e09cf4b6f61b834 /opt/ndk.zip" | sha1sum -c - \
    && cd /opt && unzip ndk.zip && rm ndk.zip

RUN git clone https://gitlab.com/fdroid/fdroiddata.git /repo
