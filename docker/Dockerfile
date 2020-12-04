# Builds the Web Client from the latest git repo

# Two stages are used to reduce complexity and final image size. The first stage builds the actual
# client. The second stage runs the web client using an nginx server, using the nginx
# configurations in this folder as well as the built files from the previous stage.

# Build Stage =====================================================================================

# Use node image for build step (this has yarn which we need)
FROM node:alpine as build

# This variable allows you to set the default etesync server for the web client.
# Change this to your own server if self hosting.
ENV REACT_APP_DEFAULT_API_PATH "https://api.etebase.com/partner/etesync/"

# Clones the latest web client code from git and builds the client and its dependencies with yarn
RUN git clone https://github.com/etesync/etesync-web.git etesync-web && \
    cd etesync-web && \
    yarn && \
    yarn build

# Run Stage =======================================================================================

# This lightweight image contains nginx which will run the web client
FROM nginx:alpine

# Grabs the built web client files from the previous build stage
COPY --from=build /etesync-web/build /usr/share/nginx/html

# Copies the nginx configuration from this folder to the running container
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Exposes port 80, the port nginx is configured to listen on
EXPOSE 80
