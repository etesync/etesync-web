# Build the EteSync web client

# Select image
FROM node:12 as web

# Set version tag. Change this as necessary
ARG ETESYNC_WEB_TAG=v0.6.1

# Download the tarball
ADD https://github.com/etesync/etesync-web/archive/${ETESYNC_WEB_TAG}.tar.gz etesync_web.tar.gz

# Set the server url. Change as necessary
ENV REACT_APP_DEFAULT_API_PATH "/"

# Build the website
RUN mkdir -p etesync-web \
    && tar xf etesync_web.tar.gz --strip-components=1 -C etesync-web \
    && cd etesync-web \
    && yarn \
    && yarn build \
    && mkdir -p /opt/etesync/web \
    && mv build /opt/etesync/web
 
# Install the nginx server
RUN apt update &&\
    apt install -y nginx

# Install nginx config file
COPY etesync_web_nginx.conf /etc/nginx/sites-enabled/

# Remove default config
RUN rm /etc/nginx/sites-enabled/default

# Setup volumes
VOLUME /etc/nginx/sites-enabled/
VOLUME /opt/etesync/web

# Expose the port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



