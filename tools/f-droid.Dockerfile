FROM debian:stretch

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_NDK=/opt/android-ndk-r19c \
    LC_ALL=en_US.UTF-8
ENV PATH=/fdroidserver:$ANDROID_HOME/tools/bin:$ANDROID_HOME/tools:/opt/node-v10.15.0-linux-x64/bin:$PATH

RUN apt update \
	&& apt install -y \
        gcc \
        g++ \
        make \
        python \
        python3 \
        wget \
        curl \
        unzip \
        openjdk-8-jdk \
        git \
        python3-pyasn1 \
        python3-pyasn1-modules \
        python3-yaml \
        python3-requests \
        locales \
    && apt clean \
    && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && echo 'LANG="en_US.UTF-8"'>/etc/default/locale \
    && dpkg-reconfigure --frontend=noninteractive locales

RUN wget "https://nodejs.org/dist/v10.15.0/node-v10.15.0-linux-x64.tar.xz" -O node.tar.xz \
    && echo "4ee8503c1133797777880ebf75dcf6ae3f9b894c66fd2d5da507e407064c13b5 node.tar.xz" | sha256sum -c - \
    && tar xJf node.tar.xz \
    && mv node-v10.15.0-linux-x64 /opt/ \
    && rm node.tar.xz \
    && chown -R root:root /opt/node-v10.15.0-linux-x64

RUN mkdir -p $ANDROID_HOME \
    && wget "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip" -O $ANDROID_HOME/sdk.zip \
    && echo "92ffee5a1d98d856634e8b71132e8a95d96c83a63fde1099be3d86df3106def9 $ANDROID_HOME/sdk.zip" | sha256sum -c - \
    && cd $ANDROID_HOME && unzip sdk.zip && rm sdk.zip \
    && yes | sdkmanager "platform-tools" "tools" "build-tools;28.0.3" "platforms;android-28"

RUN wget "https://dl.google.com/android/repository/android-ndk-r19c-linux-x86_64.zip" -O /opt/ndk.zip \
    && echo "fd94d0be6017c6acbd193eb95e09cf4b6f61b834 /opt/ndk.zip" | sha1sum -c - \
    && cd /opt && unzip ndk.zip && rm ndk.zip

RUN git clone https://gitlab.com/fdroid/fdroidserver.git /fdroidserver \
    && git clone https://gitlab.com/fdroid/fdroiddata.git /repo

WORKDIR /repo
ENTRYPOINT ["fdroid"]