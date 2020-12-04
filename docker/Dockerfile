# Builds the Web Client from the latest git repo

# Build Stage =====================================================================================
FROM node:alpine as build
ENV DEFAULT_ETEBASE_SERVER "http://example.com"
RUN export REACT_APP_DEFAULT_API_PATH=${DEFAULT_ETEBASE_SERVER} && \
    git clone https://github.com/etesync/etesync-web.git etesync-web && \
    cd etesync-web && \
    yarn && \
    yarn build

# Run Stage =======================================================================================
FROM nginx:alpine
COPY --from=build /etesync-web/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EOF
