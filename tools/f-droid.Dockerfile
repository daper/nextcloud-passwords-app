FROM debian:stretch

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
        python3-git \
        locales \
    && apt clean \
    && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && echo 'LANG="en_US.UTF-8"'>/etc/default/locale \
    && dpkg-reconfigure --frontend=noninteractive locales

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_NDK=/opt/android-ndk-r19c \
    LC_ALL=en_US.UTF-8 \
    NODE_VERSION=12.18.1 \
    NODE_SHA256=863f816967e297c9eb221ad3cf32521f7ac46fffc66750e60f159ed63809affa

ENV PATH=/fdroidserver:$ANDROID_HOME/tools/bin:/opt/node-v${NODE_VERSION}-linux-x64/bin:$PATH

RUN wget "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -O node.tar.xz \
    && echo "${NODE_SHA256} node.tar.xz" | sha256sum -c - \
    && tar xJf node.tar.xz \
    && mv node-v${NODE_VERSION}-linux-x64 /opt/ \
    && rm node.tar.xz \
    && chown -R root:root /opt/node-v${NODE_VERSION}-linux-x64

RUN mkdir -p $ANDROID_HOME \
    && wget "https://dl.google.com/android/repository/commandlinetools-linux-6609375_latest.zip" -O $ANDROID_HOME/sdk.zip \
    && echo "89f308315e041c93a37a79e0627c47f21d5c5edbe5e80ea8dc0aac8a649e0e92 $ANDROID_HOME/sdk.zip" | sha256sum -c - \
    && cd $ANDROID_HOME && unzip sdk.zip && rm sdk.zip \
    && yes | sdkmanager --sdk_root=${ANDROID_HOME} "platform-tools" "tools" "build-tools;28.0.3" "platforms;android-28"

RUN wget "https://dl.google.com/android/repository/android-ndk-r21d-linux-x86_64.zip" -O /opt/ndk.zip \
    && echo "bcf4023eb8cb6976a4c7cff0a8a8f145f162bf4d /opt/ndk.zip" | sha1sum -c - \
    && cd /opt && unzip ndk.zip && rm ndk.zip

RUN git clone https://gitlab.com/fdroid/fdroidserver.git /fdroidserver \
    && git clone https://gitlab.com/fdroid/fdroiddata.git /repo

WORKDIR /repo
ENTRYPOINT ["fdroid"]