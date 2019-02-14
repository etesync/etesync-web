SSH_HOST=client.etesync.com
SSH_PORT=22
SSH_USER=etesync
SSH_TARGET_DIR=sites/client.etesync.com

OUTPUTDIR=./build

export INLINE_RUNTIME_CHUNK=false

yarn build

sed -i "s#\(<script type=\"text/javascript\"\)#\1 integrity=\"sha384-$(shasum -b -a 384 build/static/js/main.*.js | xxd -r -p | base64 -w0)\" crossorigin=\"anonymous\"#" build/index.html
./page-signer.js build/index.html build/index.html
rsync -e "ssh -p ${SSH_PORT}" -P --delete -rvzc --exclude '*.map' ${OUTPUTDIR}/ ${SSH_USER}@${SSH_HOST}:${SSH_TARGET_DIR}
