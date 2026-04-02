#!/bin/sh
set -e

# Write Xdebug ini at container start so env vars are resolved at runtime
cat > /usr/local/etc/php/conf.d/zz-xdebug.ini <<INI
xdebug.mode=${XDEBUG_MODE:-debug,develop}
xdebug.start_with_request=${XDEBUG_START_WITH_REQUEST:-yes}
xdebug.client_host=${XDEBUG_CLIENT_HOST:-host.docker.internal}
xdebug.client_port=${XDEBUG_CLIENT_PORT:-9003}
xdebug.idekey=${XDEBUG_IDEKEY:-VSCODE}
xdebug.log_level=0
INI

exec "$@"