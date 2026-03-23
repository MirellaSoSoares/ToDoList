# ── Build stage: install PHP extensions ───────────────────────────────────────
FROM php:8.4-apache AS base

COPY zscaler-root-ca.crt /usr/local/share/ca-certificates/zscaler-root-ca.crt
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install PDO + MySQL driver and clean up apt cache in one layer
RUN docker-php-ext-install pdo pdo_mysql

# Install and enable Xdebug for step debugging
RUN apt-get update \
    && apt-get install -y --no-install-recommends git $PHPIZE_DEPS \
    && git clone --depth 1 https://github.com/xdebug/xdebug.git /tmp/xdebug \
    && cd /tmp/xdebug \
    && phpize \
    && ./configure \
    && make -j"$(nproc)" \
    && make install \
    && docker-php-ext-enable xdebug \
    && rm -rf /tmp/xdebug \
    && apt-get purge -y --auto-remove git \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite (useful for future routing needs)
RUN a2enmod rewrite

# ── Application ────────────────────────────────────────────────────────────────
WORKDIR /var/www/html

# Local development uses bind-mount from docker-compose (no image COPY)

# Ensure Apache serves index.html as the default document
RUN echo "DirectoryIndex index.html index.php" \
    > /etc/apache2/conf-enabled/directory-index.conf

# Entrypoint writes Xdebug ini at container start (env vars resolved at runtime)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && touch /usr/local/etc/php/conf.d/zz-xdebug.ini \
    && chmod 666 /usr/local/etc/php/conf.d/zz-xdebug.ini

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www/html"]
