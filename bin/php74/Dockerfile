FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

# Update and install necessary packages, including PHP 7.4, Apache, and extensions
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php -y && \
    apt-get update && \
    apt-get install -y apache2 \
    php7.4 \
    php7.4-cli \
    php7.4-common \
    php7.4-mysql \
    php7.4-sqlite3 \
    php7.4-bcmath \
    php7.4-gd \
    php7.4-curl \
    php7.4-intl \
    php7.4-mbstring \
    php7.4-xml \
    php7.4-zip \
    php7.4-json \
    php7.4-readline \
    php7.4-tokenizer \
    php7.4-calendar \
    php7.4-exif \
    php7.4-gettext \
    php7.4-redis \
    php-pear \
    php-imagick \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libmagickwand-dev \
    libicu-dev \
    nano wget dialog build-essential git curl iputils-ping zlib1g-dev libzip-dev libonig-dev libcurl4 libcurl4-openssl-dev zip openssl && \
    rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers ssl

# Enable Freetype, JPEG and PNG support for GD in PHP
RUN phpenmod gd

# Download and install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Insure an SSL directory exists
RUN mkdir -p /etc/apache2/ssl

# Set Apache to run in foreground by default
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]

EXPOSE 80 443
